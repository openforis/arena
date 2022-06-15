import * as Survey from '@core/survey/survey'

import {
  NodeDefExpressionEvaluator as CoreNodeDefExpressionEvaluator,
  NodeDefExpressionValidator as CoreNodeDefExpressionValidator,
} from '@openforis/arena-core'

export const findReferencedNodeDefs = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  const referencedNodeDefUuids = new CoreNodeDefExpressionValidator().findReferencedNodeDefUuids({
    expression: exprString,
    survey,
    nodeDef,
    isContextParent,
    selfReferenceAllowed,
  })
  return Survey.getNodeDefsByUuids(referencedNodeDefUuids)(survey)
}

export const findReferencedNodeDefLast = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  return new CoreNodeDefExpressionEvaluator().evalExpression({
    survey,
    nodeDef,
    expression: exprString,
    isContextParent,
    selfReferenceAllowed,
  })
}

export const validate = ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
}) => {
  const { validationResult } = new CoreNodeDefExpressionValidator().validate({
    expression: exprString,
    survey,
    nodeDefCurrent,
    isContextParent,
    selfReferenceAllowed,
  })
  if (validationResult === null || validationResult.valid) return null

  return validationResult
}
