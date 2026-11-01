import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'

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

// functions available only in SQL expressions (e.g. data query filters), converted by Expression.toSql
const likeFunction = { minArity: 2, maxArity: 2, executor: () => () => true }
const sqlOnlyFunctions = {
  [Expression.functionNames.like]: likeFunction,
  [Expression.functionNames.ilike]: likeFunction,
}

const createValidator = ({ mode }) => {
  const validator = new CoreNodeDefExpressionValidator()
  if (mode === Expression.modes.sql) {
    validator.functions = { ...validator.functions, ...sqlOnlyFunctions }
  }
  return validator
}

export const validate = async ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
  includeAnalysis = false,
  mode = Expression.modes.json,
}) => {
  const { validationResult } = await createValidator({ mode }).validate({
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
