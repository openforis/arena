import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '../manager/nodeDefManager'

const fetchSurvey = async ({ surveyId, cycle }, client = db) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, cycle, draft: true, advanced: true, validate: false },
    client
  )

const _validateNodeDefs = async ({ survey, nodeDef, updatedNodeDefs, nodeDefsDependentByUuid }) => {
  const nodeDefsToValidateByUuid = {}

  // always re-validate parent entity (keys may have been changed)
  const nodeDefParent = !nodeDef || NodeDef.isRoot(nodeDef) ? null : Survey.getNodeDefParent(nodeDef)(survey)
  if (nodeDefParent) {
    nodeDefsToValidateByUuid[NodeDef.getUuid(nodeDefParent)] = nodeDefParent
  }
  Object.assign(nodeDefsToValidateByUuid, updatedNodeDefs, nodeDefsDependentByUuid)

  const nodeDefsToValidate = Object.values(nodeDefsToValidateByUuid)

  // perform node defs validation
  const nodeDefsValidationArray = await Promise.all(
    nodeDefsToValidate.map((nodeDefToValidate) => SurveyValidator.validateNodeDef(survey, nodeDefToValidate))
  )
  const nodeDefsValidationsByUuid = nodeDefsToValidate.reduce((nodeDefsValidationsAcc, nodeDefToValidate, index) => {
    nodeDefsValidationsAcc[NodeDef.getUuid(nodeDefToValidate)] = nodeDefsValidationArray[index]
    return nodeDefsValidationsAcc
  }, {})
  const valid = nodeDefsValidationArray.every(Validation.isValid)

  return Validation.newInstance(valid, nodeDefsValidationsByUuid)
}

const afterNodeDefUpdate = async ({ survey, nodeDef = null, nodeDefsDependentsUuids = [], nodeDefsUpdated = {} }) => {
  const allUpdatedNodeDefs = { ...nodeDefsUpdated }
  if (nodeDef && !allUpdatedNodeDefs[NodeDef.getUuid(nodeDef)]) {
    allUpdatedNodeDefs[NodeDef.getUuid(nodeDef)] = nodeDef
  }
  const updatedNodeDefsNotDeleted = ObjectUtils.toUuidIndexedObj(
    Object.values(allUpdatedNodeDefs).filter((def) => !NodeDef.isDeleted(def))
  )

  // merge node defs with existing ones
  let surveyUpdated = Survey.mergeNodeDefs(allUpdatedNodeDefs)(survey)

  // add dependent node defs to dependency graph
  // nodeDefsDependent can contain nodeDefs that have been updated and are in nodeDefsUpdated too: replace them with the updated ones
  const nodeDefDependents = Survey.getNodeDefsByUuids(nodeDefsDependentsUuids)(surveyUpdated)
  const nodeDefsDependentByUuid = ObjectUtils.toUuidIndexedObj(nodeDefDependents)

  surveyUpdated = await Survey.addNodeDefsDependencies({ ...updatedNodeDefsNotDeleted, ...nodeDefsDependentByUuid })(
    surveyUpdated
  )

  const dependencyGraph = Survey.getDependencyGraph(surveyUpdated)

  const nodeDefsValidation = await _validateNodeDefs({
    survey: surveyUpdated,
    nodeDef,
    updatedNodeDefs: allUpdatedNodeDefs,
    nodeDefsDependentByUuid,
  })

  return { dependencyGraph, nodeDefsUpdated: allUpdatedNodeDefs, nodeDefsValidation }
}

export const fetchNodeDef = async ({ surveyId, draft, advanced, nodeDefUuid }, client = db) =>
  NodeDefManager.fetchNodeDefByUuid(surveyId, nodeDefUuid, draft, advanced, client)

export const insertNodeDef = async ({ user, surveyId, cycle = Survey.cycleOneKey, nodeDef }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsUpdated = await NodeDefManager.insertNodeDef({ user, survey, cycle, nodeDef }, t)
    const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsUpdated })
  })

export const insertNodeDefs = async ({ user, surveyId, cycle = Survey.cycleOneKey, nodeDefs }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs }, t)

    const surveyUpdated = Survey.assocNodeDefsSimple({ nodeDefs })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDefsUpdated: nodeDefs })
  })

export const updateNodeDefProps = async (
  { user, surveyId, cycle, nodeDefUuid, parentUuid, props = {}, propsAdvanced = {}, system = false },
  client = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.updateNodeDefProps(
      { user, survey, nodeDefUuid, parentUuid, props, propsAdvanced, system },
      t
    )
    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

export const updateNodeDefsProps = async ({ surveyId, nodeDefs }, client = db) =>
  NodeDefManager.updateNodeDefPropsInBatch({ surveyId, nodeDefs }, client)

export const moveNodeDef = async ({ user, surveyId, nodeDefUuid, targetParentNodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.moveNodeDef({ user, survey, nodeDefUuid, targetParentNodeDefUuid }, t)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

export const convertNodeDef = async ({ user, surveyId, nodeDefUuid, toType }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDef = await NodeDefManager.convertNodeDef({ user, survey, nodeDefUuid, toType }, t)

    return afterNodeDefUpdate({ survey, nodeDef, nodeDefsDependentsUuids })
  })

export const cloneNodeDefFromSurvey = async (
  { sourceSurveyId, sourceNodeDefUuid, targetSurveyId, targetParentNodeDefUuid },
  client = db
) =>
  client.tx(async (t) => {
    const [sourceSurvey, targetSurvey] = await Promise.all([
      fetchSurvey({ surveyId: sourceSurveyId }, t),
      fetchSurvey({ surveyId: targetSurveyId }, t),
    ])

    // Temporarily inject the source node def subtree into the target survey so
    // Survey.cloneNodeDef can resolve references within a single survey object.
    const sourceNodeDef = Survey.getNodeDefByUuid(sourceNodeDefUuid)(sourceSurvey)
    const sourceDescendants = Survey.getNodeDefDescendants({ nodeDef: sourceNodeDef })(sourceSurvey)
    const sourceNodeDefs = ObjectUtils.toUuidIndexedObj([sourceNodeDef, ...sourceDescendants])
    const mergedSurvey = Survey.mergeNodeDefs(sourceNodeDefs)(targetSurvey)

    const existingNodeDefNames = Survey.getNodeDefsArray(targetSurvey).map((nd) => NodeDef.getName(nd))
    const { clonedNodeDefs, rootClonedNodeDef } = Survey.cloneNodeDef({
      nodeDefUuid: sourceNodeDefUuid,
      targetParentNodeDefUuid,
      existingNodeDefNames,
    })(mergedSurvey)

    return _insertClonedNodeDefsAndUpdateLayout({
      survey: targetSurvey,
      surveyId: targetSurveyId,
      clonedNodeDefs,
      rootClonedNodeDef,
      layoutRefParentNodeDefUuid: targetParentNodeDefUuid,
      layoutRefNodeDefUuid: sourceNodeDefUuid,
      t,
    })
  })

const _insertClonedNodeDefsAndUpdateLayout = async ({
  survey,
  surveyId,
  clonedNodeDefs,
  rootClonedNodeDef,
  layoutRefParentNodeDefUuid,
  layoutRefNodeDefUuid,
  t,
}) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const cycleKeys = Survey.getCycleKeys(survey)
  const defaultCycle = Survey.getDefaultCycleKey(surveyInfo)
  const layoutRefParentNodeDef = Survey.getNodeDefByUuid(layoutRefParentNodeDefUuid)(survey)
  const isLayoutRefParentForm = NodeDefLayout.isRenderForm(defaultCycle)(layoutRefParentNodeDef)
  const layoutRefParentChildren = NodeDefLayout.getLayoutChildren(defaultCycle)(layoutRefParentNodeDef)
  const layoutRefPosition = isLayoutRefParentForm
    ? layoutRefParentChildren.find((item) => item.i === layoutRefNodeDefUuid)
    : null

  const insertedNodeDefs = await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: clonedNodeDefs }, t)

  const preferredLayoutByCycle = layoutRefPosition
    ? cycleKeys.reduce((acc, cycle) => {
        const { minH, minW, h, w } = layoutRefPosition
        acc[cycle] = { minH, minW, h, w }
        return acc
      }, {})
    : null
  const parentNodeDefUpdated = await NodeDefManager.addOrRemoveNodeDefInParentLayout(
    {
      survey,
      nodeDef: rootClonedNodeDef,
      add: true,
      layoutInParentByCycle: preferredLayoutByCycle,
    },
    t
  )

  const nodeDefsUpdatedByUuid = ObjectUtils.toUuidIndexedObj(insertedNodeDefs)
  if (parentNodeDefUpdated) {
    nodeDefsUpdatedByUuid[NodeDef.getUuid(parentNodeDefUpdated)] = parentNodeDefUpdated
  }

  return afterNodeDefUpdate({ survey, nodeDefsUpdated: nodeDefsUpdatedByUuid })
}

export const cloneNodeDef = async ({ surveyId, nodeDefUuid, targetParentNodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const { clonedNodeDefs, rootClonedNodeDef } = Survey.cloneNodeDef({ nodeDefUuid, targetParentNodeDefUuid })(survey)

    const originalNodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const originalNodeDefParent = Survey.getNodeDefParent(originalNodeDef)(survey)

    return _insertClonedNodeDefsAndUpdateLayout({
      survey,
      surveyId,
      clonedNodeDefs,
      rootClonedNodeDef,
      layoutRefParentNodeDefUuid: NodeDef.getUuid(originalNodeDefParent),
      layoutRefNodeDefUuid: nodeDefUuid,
      t,
    })
  })

export const fetchNodeDefsUpdatedAndValidated = async ({ user, surveyId, cycle, nodeDefsUpdated }, client = db) => {
  const survey = await fetchSurvey({ surveyId, cycle }, client)

  return afterNodeDefUpdate({ survey, nodeDefsUpdated })
}

export const markNodeDefDeleted = async ({ user, surveyId, cycle, nodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.markNodeDefDeleted({ user, survey, cycle, nodeDefUuid }, t)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated })
  })

export const markNodeDefsDeleted = async ({ user, surveyId, cycle, nodeDefUuids }, client = db) => {
  let response = { nodeDefsUpdated: {}, nodeDefsValidation: {} }

  for (const nodeDefUuid of nodeDefUuids) {
    const _response = await markNodeDefDeleted({ user, surveyId, cycle, nodeDefUuid }, client)
    response = R.mergeDeepLeft(response, _response)
  }

  return response
}

export {
  // ======  READ - entities
  countVirtualEntities,
  fetchVirtualEntities,
} from '../repository/nodeDefRepository'
