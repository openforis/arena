import * as R from 'ramda'

import { Nodes, RecordExpressionEvaluator, RecordNodesUpdater as CoreRecordNodesUpdater } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import * as RecordReader from './recordReader'
import * as RecordUpdater from './recordUpdater'

const { updateNodesDependents } = CoreRecordNodesUpdater

// Directly evaluates `getExpressions(nodeDef)` against every instance of nodeDef's parent
// node def, and writes the resulting boolean into the parent's meta via `assocValue`.
//
// This deliberately does NOT use updateNodesDependents: that mechanism recomputes
// applicable/visible/editable by walking the survey's dependency graph starting from nodes
// whose VALUE changed, and only treats a seed node as recomputing its own state when the seed
// is an attribute or a newly created entity (see arena-core's
// recordNodesDependentsUpdaterCommons.getDependentNodePointersByType, `includeSelf`). A
// userProp(...) expression references no node, so it has no dependency-graph edge at all:
// seeding with the affected (pre-existing) entity itself would silently do nothing. Instead,
// evaluate directly and write into the parent's meta, bypassing the dependency-graph walk.
const _recomputeBooleanState = async ({ user, survey, record, nodeDefs, getExpressions, assocValue }) => {
  const evaluator = new RecordExpressionEvaluator()
  let recordUpdated = record

  for (const nodeDef of nodeDefs) {
    const expressions = getExpressions(nodeDef)
    if (R.isEmpty(expressions)) continue

    const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)
    if (!parentNodeDef) continue // root node def has no parent to store meta on

    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const parentNodes = RecordReader.getNodesByDefUuid(NodeDef.getUuid(parentNodeDef))(recordUpdated)

    for (const parentNode of parentNodes) {
      const exprEval = await evaluator.evalApplicableExpression({
        user,
        survey,
        record: recordUpdated,
        nodeCtx: parentNode,
        expressions,
      })
      const value = exprEval?.value ?? false
      const parentNodeUpdated = assocValue({ parentNode, nodeDefUuid, value })
      recordUpdated = RecordUpdater.assocNode(parentNodeUpdated, { sideEffect: false })(recordUpdated)
    }
  }
  return recordUpdated
}

// Re-evaluates default values for attributes whose default value expression depends on the
// given user (e.g. userProp) and is not flagged "evaluate one time". Uses the standard
// updateNodesDependents machinery: unlike applicable/visible/editable, default values' own
// "self" recompute (see arena-core's
// recordNodeDependentsDefaultValuesUpdater.updateSelfAndDependentsDefaultValues, which calls
// Records.getDependentNodePointers with includeSelf: true unconditionally, no entity/attribute
// restriction) correctly re-triggers for a seeded, pre-existing attribute node - it also
// already respects isDefaultValueEvaluatedOneTime and skips values the user manually edited
// (Nodes.isDefaultValueApplied / Nodes.isValueBlank checks in canApplyDefaultValue).
const _recomputeDefaultValues = async ({ user, survey, record, nodeDefs }) => {
  const nodeDefsToRecompute = nodeDefs.filter(
    (nodeDef) => !R.isEmpty(NodeDef.getDefaultValues(nodeDef)) && !NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)
  )
  if (R.isEmpty(nodeDefsToRecompute)) return record

  const nodesToRecompute = nodeDefsToRecompute.reduce((acc, nodeDef) => {
    RecordReader.getNodesByDefUuid(NodeDef.getUuid(nodeDef))(record).forEach((node) => {
      acc[Node.getUuid(node)] = node
    })
    return acc
  }, {})
  if (R.isEmpty(nodesToRecompute)) return record

  const { record: recordUpdated } = await updateNodesDependents({
    user,
    survey,
    record,
    nodes: nodesToRecompute,
    sideEffect: true,
  })
  return recordUpdated
}

// Re-evaluates applicability/relevance, visibility, editability and default values for node
// defs whose expressions depend on the given user (e.g. userProp). Pure/in-memory: it never
// persists anything, so callers decide whether/how the result should be stored.
const recomputeUserDependentNodeState = async ({ user, survey, record }) => {
  const nodeDefsUserDependent = Survey.getNodeDefsArray(survey).filter(NodeDef.hasUserDependentExpressions)
  if (R.isEmpty(nodeDefsUserDependent)) return record

  let recordUpdated = await _recomputeBooleanState({
    user,
    survey,
    record,
    nodeDefs: nodeDefsUserDependent,
    getExpressions: NodeDef.getApplicable,
    assocValue: ({ parentNode, nodeDefUuid, value }) => Nodes.assocChildApplicability(parentNode, nodeDefUuid, value),
  })

  recordUpdated = await _recomputeBooleanState({
    user,
    survey,
    record: recordUpdated,
    nodeDefs: nodeDefsUserDependent,
    getExpressions: NodeDef.getVisibleIf,
    assocValue: ({ parentNode, nodeDefUuid, value }) => Nodes.assocChildVisible(parentNode, nodeDefUuid, value, false),
  })

  recordUpdated = await _recomputeBooleanState({
    user,
    survey,
    record: recordUpdated,
    nodeDefs: nodeDefsUserDependent,
    getExpressions: NodeDef.getEditableIf,
    assocValue: ({ parentNode, nodeDefUuid, value }) => Nodes.assocChildEditable(parentNode, nodeDefUuid, value, false),
  })

  // Default values are recomputed last, using the applicability just recomputed above
  // (default values only get (re)applied to currently-applicable nodes).
  recordUpdated = await _recomputeDefaultValues({
    user,
    survey,
    record: recordUpdated,
    nodeDefs: nodeDefsUserDependent,
  })

  return recordUpdated
}

export const RecordUserDependentStateUpdater = {
  recomputeUserDependentNodeState,
}
