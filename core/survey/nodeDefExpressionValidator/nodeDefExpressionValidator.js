import { NodeDefExpressionEvaluator, NodeDefExpressionValidator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

export const evaluateExpression = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  if (!exprString) {
    return []
  }
  const nodeDefContext = isContextParent ? Survey.getNodeDefParent(nodeDef)(survey) : nodeDef
  const context = { survey, nodeDefCurrent: nodeDef, nodeDefContext, selfReferenceAllowed }
  const result = new NodeDefExpressionEvaluator().evaluate(exprString, context)
  const { referencedNodeDefUuids } = context
  const referencedNodeDefs = referencedNodeDefUuids
    ? Survey.getNodeDefsByUuids([...referencedNodeDefUuids])(survey)
    : []
  return { referencedNodeDefs, result }
}

export const findReferencedNodeDefs = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  const { referencedNodeDefs } = evaluateExpression({
    survey,
    nodeDef,
    exprString,
    isContextParent,
    selfReferenceAllowed,
  })
  return referencedNodeDefs
}

export const validate = ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
}) => {
  const nodeDefContext = isContextParent ? Survey.getNodeDefParent(nodeDefCurrent)(survey) : nodeDefCurrent
  const context = { survey, nodeDefCurrent, nodeDefContext, selfReferenceAllowed }
  const validationResult = new NodeDefExpressionValidator().validate(exprString, context)
  return validationResult && !validationResult.valid ? validationResult : null
}
