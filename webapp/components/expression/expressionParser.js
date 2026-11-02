import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { isNotBlank } from '@core/stringUtils'

export const parseQuery = ({ query, mode, canBeConstant = false }) => {
  const exprQuery = Expression.fromString(query, mode)
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

/**
 * Converts an expression string from a text mode (syntax) to another one, e.g. from SQL to JavaScript.
 * @param {object} params - The parameters.
 * @param {string} params.query - The expression string.
 * @param {string} params.textModeFrom - The text mode the expression string is written in.
 * @param {string} params.textModeTo - The text mode to convert the expression string to.
 * @returns {string} - The converted expression string, or the original one if it cannot be parsed.
 */
export const convertQueryTextMode = ({ query, textModeFrom, textModeTo }) => {
  if (!isNotBlank(query) || textModeFrom === textModeTo) return query
  try {
    return Expression.toString(Expression.fromString(query, textModeFrom), textModeTo)
  } catch {
    // incomplete expression: keep it as it is
    return query
  }
}

/**
 * Returns the items of the button group used to select the text mode (syntax) of an expression.
 * @param {object} params - The parameters.
 * @param {object} params.i18n - The i18n object.
 * @returns {object[]} - The button group items.
 */
export const textModeItems = ({ i18n }) =>
  [Expression.modes.sql, Expression.modes.json].map((textMode) => ({
    key: textMode,
    label: i18n.t(`nodeDefEdit:expressionSyntax.${textMode}`),
  }))

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
