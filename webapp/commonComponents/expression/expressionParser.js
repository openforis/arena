import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import Expression from '../../../common/exprParser/expression'

import { isNotBlank } from '../../../common/stringUtils'

export const parseQuery = (query, mode, canBeConstant) => {
  const exprQuery = Expression.fromString(query, mode)
  const isCompound = Expression.isCompound(exprQuery)
  const isBinary = Expression.isBinary(exprQuery)
  const isLogical = Expression.isLogical(exprQuery)

  const expr = isBinary || isLogical
    ? exprQuery
    : Expression.newBinary(
      isCompound && canBeConstant
        ? Expression.newLiteral()
        : isCompound
        ? Expression.newIdentifier()
        : exprQuery,
      Expression.newLiteral()
    )
  return expr
}

export const isExprValid = (expr, canBeConstant) => {
  try {
    const exprString = Expression.toString(expr)
    const exprToValidate = canBeConstant && isNotBlank(exprString)
      ? Expression.fromString(exprString)
      : expr

    return Expression.isValid(exprToValidate)
  } catch (e) {
    return false
  }
}

export const getLiteralSearchParams = (survey, nodeDef) => {

  const surveyId = Survey.getId(survey)

  const literalSearchParams = nodeDef && NodeDef.isNodeDefCode(nodeDef) ?
    {
      surveyId,
      type: NodeDef.nodeDefType.code,
      categoryUuid: NodeDef.getNodeDefCategoryUuid(nodeDef),
      categoryLevelIndex: Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey),
      lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    }
    : nodeDef && NodeDef.isNodeDefTaxon(nodeDef) ?
      {
        surveyId,
        type: NodeDef.nodeDefType.taxon,
        taxonomyUuid: NodeDef.getNodeDefTaxonomyUuid(nodeDef)
      }
      : null

  return literalSearchParams
}