import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { isNotBlank } from '@core/stringUtils'

export const parseQuery = (query, mode, canBeConstant) => {
  const exprQuery = Expression.fromString(query, mode)
  const isBinary = Expression.isBinary(exprQuery)
  const isSequence = Expression.isSequence(exprQuery)

  if (isBinary || isSequence) return exprQuery

  return Expression.newBinaryEmpty({ canBeConstant, exprQuery })
}

export const isExprValid = (expr, canBeConstant) => {
  try {
    const exprString = Expression.toString(expr)
    const exprToValidate = canBeConstant && isNotBlank(exprString) ? Expression.fromString(exprString) : expr

    return Expression.isValid(exprToValidate)
  } catch (error) {
    return false
  }
}

export const getLiteralSearchParams = (survey, nodeDef, preferredLang) => {
  const surveyId = Survey.getId(survey)

  const literalSearchParams =
    nodeDef && NodeDef.isCode(nodeDef)
      ? {
          surveyId,
          type: NodeDef.nodeDefType.code,
          categoryUuid: NodeDef.getCategoryUuid(nodeDef),
          categoryLevelIndex: Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey),
          lang: Survey.getLanguage(preferredLang)(Survey.getSurveyInfo(survey)),
        }
      : nodeDef && NodeDef.isTaxon(nodeDef)
        ? {
            surveyId,
            type: NodeDef.nodeDefType.taxon,
            taxonomyUuid: NodeDef.getTaxonomyUuid(nodeDef),
          }
        : null

  return literalSearchParams
}
