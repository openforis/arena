import * as Survey from '@core/survey/survey'

import {
  NodeDefExpressionEvaluator as CoreNodeDefExpressionEvaluator,
  NodeDefExpressionValidator as CoreNodeDefExpressionValidator,
} from '@openforis/arena-core'

export const findReferencedNodeDefs = async ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  const referencedNodeDefUuids = await new CoreNodeDefExpressionValidator().findReferencedNodeDefUuids({
    expression: exprString,
    survey,
    nodeDef,
    isContextParent,
    selfReferenceAllowed,
  })
  return Survey.getNodeDefsByUuids(referencedNodeDefUuids)(survey)
}

export const findReferencedNodeDefLast = async ({
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

export const validate = async ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
  includeAnalysis = false,
}) => {
  const { validationResult } = await new CoreNodeDefExpressionValidator().validate({
    expression: exprString,
    survey,
    nodeDefCurrent,
    isContextParent,
    selfReferenceAllowed,
    includeAnalysis,
  })
  if (validationResult === null || validationResult.valid) return null

  return validationResult
}
