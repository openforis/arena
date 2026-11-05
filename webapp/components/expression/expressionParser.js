import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { isNotBlank } from '@core/stringUtils'

export const parseQuery = ({ query, canBeConstant = false }) => {
  const exprQuery = Expression.fromString(query)
  if (
    [Expression.types.BinaryExpression, Expression.types.SequenceExpression].includes(Expression.getType(exprQuery))
  ) {
    return exprQuery
  }
  return Expression.newBinaryEmpty({ canBeConstant, exprQuery })
}

export const normalize = ({ expr, canBeConstant = false, canBeCall = false }) => {
  if (canBeConstant || canBeCall) {
    // expr can be a binary expression with an empty operator and right operand;
    // formatting and parsing it again will keep only the left operand in the evaluation
    const exprString = Expression.toString(expr)
    if (isNotBlank(exprString)) {
      return Expression.fromString(exprString)
    }
  }
  return expr
}

export const isExprValid = ({ expr, canBeConstant = false, canBeCall = false }) => {
  try {
    const exprToValidate = normalize({ expr, canBeConstant, canBeCall })
    return Expression.isValid(exprToValidate)
  } catch {
    // expression cannot be parsed
    return false
  }
}

const basicEditorNodeTypes = new Set([
  Expression.types.BinaryExpression,
  Expression.types.CallExpression,
  Expression.types.Identifier,
  Expression.types.Literal,
  Expression.types.MemberExpression,
  Expression.types.SequenceExpression,
  Expression.types.ThisExpression,
])

const isBasicEditorNode = (node) => {
  const { type, argument, callee } = node
  // e.g. -1: managed as a literal
  if (type === Expression.types.UnaryExpression) return argument?.type === Expression.types.Literal
  // method calls (e.g. text_attr.includes('abc')) cannot be edited: functions are selected by name
  if (type === Expression.types.CallExpression && callee?.type === Expression.types.MemberExpression) return false
  return basicEditorNodeTypes.has(type)
}

/**
 * Checks if the expression can be edited with the basic expression editor.
 * @param {object | null} expr - The expression.
 * @returns {boolean} - True if the expression and all its sub expressions are supported by the basic editor.
 */
export const isEditableInBasicEditor = (expr) => {
  if (!expr) return true
  if (!isBasicEditorNode(expr)) return false
  return Object.values(expr)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => value?.type)
    .every(isEditableInBasicEditor)
}

export const getLiteralSearchParams = (survey, nodeDef, preferredLang) => {
  const surveyId = Survey.getId(survey)

  if (nodeDef && NodeDef.isCode(nodeDef)) {
    return {
      surveyId,
      type: NodeDef.nodeDefType.code,
      categoryUuid: NodeDef.getCategoryUuid(nodeDef),
      categoryLevelIndex: Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey),
      lang: Survey.getLanguage(preferredLang)(Survey.getSurveyInfo(survey)),
    }
  }
  if (nodeDef && NodeDef.isTaxon(nodeDef)) {
    return {
      surveyId,
      type: NodeDef.nodeDefType.taxon,
      taxonomyUuid: NodeDef.getTaxonomyUuid(nodeDef),
    }
  }
  return null
}
