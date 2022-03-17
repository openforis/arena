import * as R from 'ramda'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as RecordExpressionValueConverter from '@core/record/recordExpressionValueConverter'
import * as RecordReader from './recordReader'
import RecordUpdateResult from './RecordUpdateResult'

const _logExpressionError = ({ error, expressionType, survey, nodeDef, expressionsToEvaluate, logger }) => {
  const surveyId = Survey.getId(survey)
  const nodeDefName = NodeDef.getName(nodeDef)
  const expressionsString = JSON.stringify(expressionsToEvaluate)
  const errorMessage = `error evaluating ${expressionType} in survey ${surveyId} for node def ${nodeDefName} / ${expressionsString}: ${error}`

  if (logger?.errorEnabled) {
    logger.error(errorMessage)
  } else {
    throw new Error(errorMessage)
  }
}

/**
 * Module responsible for updating applicable and default values.
 */

export const updateSelfAndDependentsApplicable = ({ survey, record, node, logger = null }) => {
  // Output
  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes
  const nodePointersToUpdate = RecordReader.getDependentNodePointers(
    survey,
    node,
    Survey.dependencyTypes.applicable
  )(record)

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (Node.isCreated(node) && !A.isEmpty(NodeDef.getApplicable(nodeDef))) {
    // Include a pointer to node itself if it has just been created and it has an "applicable if" expression
    nodePointersToUpdate.push({
      nodeDef,
      nodeCtx: RecordReader.getParentNode(node)(record),
    })
  }

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  nodePointersToUpdate.forEach((nodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer
    const nodeCtxUuid = Node.getUuid(nodeCtxNodePointer)
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) || nodeCtxNodePointer
    const expressionsToEvaluate = NodeDef.getApplicable(nodeDefNodePointer)
    try {
      // 3. evaluate applicable expression
      const exprEval = RecordExpressionParser.evalApplicableExpression(
        survey,
        updateResult.record,
        nodeCtx,
        expressionsToEvaluate
      )

      const applicable = A.propOr(false, 'value', exprEval)

      // 4. persist updated node value if changed, and return updated node
      const nodeDefUuid = NodeDef.getUuid(nodeDefNodePointer)

      if (Node.isChildApplicable(nodeDefUuid)(nodeCtx) !== applicable) {
        // Applicability changed

        // update node and add it to nodes updated
        const nodeCtxUpdated = Node.assocChildApplicability({ nodeDefUuid, applicable })(nodeCtx)
        updateResult.addNode(nodeCtxUpdated)

        const nodeCtxChildren = RecordReader.getNodeChildrenByDefUuid(nodeCtx, nodeDefUuid)(updateResult.record)
        nodeCtxChildren.forEach((nodeCtxChild) => {
          // 5. add nodeCtxChild and its descendants to nodesUpdated
          RecordReader.visitDescendantsAndSelf(nodeCtxChild, (nodeDescendant) => {
            updateResult.addNode(nodeDescendant)
          })(updateResult.record)
        })
      }
    } catch (error) {
      _logExpressionError({
        error,
        expressionType: 'applicable',
        survey,
        nodeDef: nodeDefNodePointer,
        expressionsToEvaluate,
        logger,
      })
    }
  })

  return updateResult
}

export const updateSelfAndDependentsDefaultValues = ({ survey, record, node, logger = null }) => {
  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodeDependentPointersFilterFn = (nodePointer) => {
    const { nodeCtx, nodeDef } = nodePointer

    return NodeDef.isAttribute(nodeDef) && (Node.isValueBlank(nodeCtx) || Node.isDefaultValueApplied(nodeCtx))
  }

  const nodePointersToUpdate = RecordReader.getDependentNodePointers(
    survey,
    node,
    Survey.dependencyTypes.defaultValues,
    true, // IncludeSelf
    nodeDependentPointersFilterFn
  )(record)

  // 2. update expr to node and dependent nodes
  nodePointersToUpdate.forEach(({ nodeCtx, nodeDef }) => {
    const expressionsToEvaluate = NodeDef.getDefaultValues(nodeDef)

    try {
      // 3. evaluate applicable default value expression
      const exprEval = RecordExpressionParser.evalApplicableExpression(survey, record, nodeCtx, expressionsToEvaluate)

      const oldValue = Node.getValue(nodeCtx, null)

      const exprEvalValue = A.propOr(null, 'value')(exprEval)
      const exprValue = A.isNull(exprEvalValue)
        ? null
        : RecordExpressionValueConverter.toNodeValue(survey, record, nodeCtx, exprEvalValue)

      // 4
      // 4a. if node value is not changed, do nothing
      if (R.equals(oldValue, exprValue)) {
        return // do nothing
      }

      // 4b. update node value and meta and return updated node
      const defaultValueApplied = !A.isNull(exprEval)
      const nodeCtxUpdated = A.pipe(
        Node.assocIsDefaultValueApplied(defaultValueApplied),
        Node.assocValue(exprValue)
      )(nodeCtx)
      updateResult.addNode(nodeCtxUpdated)
    } catch (error) {
      _logExpressionError({ error, type: 'default value', survey, nodeDef, expressionsToEvaluate, logger })
    }
  })

  return updateResult
}
