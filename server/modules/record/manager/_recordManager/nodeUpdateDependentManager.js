import * as R from 'ramda'

import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as RecordExpressionValueConverter from '@core/record/recordExpressionValueConverter'

import * as NodeRepository from '../../repository/nodeRepository'

/**
 * Module responsible for updating applicable and default values.
 */

export const updateSelfAndDependentsApplicable = async (survey, record, node, tx) => {
  // Output
  const nodesUpdated = {} // Updated nodes indexed by uuid

  // 1. fetch dependent nodes
  const nodePointersToUpdate = Record.getDependentNodePointers(survey, node, Survey.dependencyTypes.applicable)(record)

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (Node.isCreated(node) && !R.isEmpty(NodeDef.getApplicable(nodeDef))) {
    // Include a pointer to node itself if it has just been created and it has an "applicable if" expression
    nodePointersToUpdate.push({
      nodeDef,
      nodeCtx: Record.getParentNode(node)(record),
    })
  }

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  await PromiseUtils.each(nodePointersToUpdate, async (nodePointer) => {
    const { nodeCtx, nodeDef: nodeDefNodePointer } = nodePointer
    // 3. evaluate applicable expression
    const exprEval = RecordExpressionParser.evalApplicableExpression(
      survey,
      record,
      nodeCtx,
      NodeDef.getApplicable(nodeDefNodePointer)
    )
    const applicable = R.propOr(false, 'value', exprEval)

    // 4. persist updated node value if changed, and return updated node
    const nodeDefUuid = NodeDef.getUuid(nodeDefNodePointer)

    if (Node.isChildApplicable(nodeDefUuid)(nodeCtx) !== applicable) {
      // Applicability changed

      // update node and add it to nodesUpdated
      const nodeCtxUuid = Node.getUuid(nodeCtx)
      nodesUpdated[nodeCtxUuid] = {
        ...(await NodeRepository.updateChildrenApplicability(
          Survey.getId(survey),
          nodeCtxUuid,
          nodeDefUuid,
          applicable,
          tx
        )),
        // Preserve 'created' flag (used by rdb generator)
        ...(Node.isCreated(nodeCtx) ? { [Node.keys.created]: true } : {}),
      }

      const nodeCtxChildren = Record.getNodeChildrenByDefUuid(nodeCtx, nodeDefUuid)(record)
      nodeCtxChildren.forEach((nodeCtxChild) => {
        // 5. add nodeCtxChild and its descendants to nodesUpdated
        Record.visitDescendantsAndSelf(nodeCtxChild, (nodeDescendant) => {
          nodesUpdated[Node.getUuid(nodeDescendant)] = nodeDescendant
        })(record)
      })
    }
  })

  return nodesUpdated
}

export const updateSelfAndDependentsDefaultValues = async (survey, record, node, tx) => {
  // 1. fetch dependent nodes

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodeDependentPointersFilterFn = (nodePointer) => {
    const { nodeCtx, nodeDef } = nodePointer

    return NodeDef.isAttribute(nodeDef) && (Node.isValueBlank(nodeCtx) || Node.isDefaultValueApplied(nodeCtx))
  }

  const nodePointersToUpdate = Record.getDependentNodePointers(
    survey,
    node,
    Survey.dependencyTypes.defaultValues,
    true, // IncludeSelf
    nodeDependentPointersFilterFn
  )(record)

  // 2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodePointersToUpdate.map(async ({ nodeCtx, nodeDef }) => {
      // 3. evaluate applicable default value expression
      const exprEval = RecordExpressionParser.evalApplicableExpression(
        survey,
        record,
        nodeCtx,
        NodeDef.getDefaultValues(nodeDef)
      )

      const oldValue = Node.getValue(nodeCtx, null)

      const exprValue = R.pipe(
        R.propOr(null, 'value'),
        R.unless(R.isNil, (value) => RecordExpressionValueConverter.toNodeValue(survey, record, nodeCtx, value))
      )(exprEval)

      // 4. persist updated node value if changed, and return updated node

      if (R.equals(oldValue, exprValue)) {
        return {}
      }

      const nodeCtxUuid = Node.getUuid(nodeCtx)

      return {
        [nodeCtxUuid]: await NodeRepository.updateNode(
          Survey.getId(survey),
          nodeCtxUuid,
          exprValue,
          { [Node.metaKeys.defaultValue]: !R.isNil(exprEval) },
          Record.isPreview(record),
          tx
        ),
      }
    })
  )

  return R.mergeAll(nodesUpdated)
}
