import * as R from 'ramda'

import * as StringUtils from '@core/stringUtils'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Expression from '@core/expressionParser/expression'

import { identifierEval } from './identifierEval'
import { memberEval } from './memberEval'

export const evalNodeQuery = (survey, record, node, query) => {
  const evaluators = {
    [Expression.types.Identifier]: identifierEval(survey, record),
    [Expression.types.MemberExpression]: memberEval,
  }

  console.log('evalNodeQuery', query, { node, evaluators })
  return Expression.evalString(query, { node, evaluators })
}

const _getApplicableExpressions = (survey, record, nodeCtx, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = []
  for (let i = 0; i < expressions.length; i += 1) {
    const expression = expressions[i]

    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || evalNodeQuery(survey, record, nodeCtx, applyIfExpr)) {
      applicableExpressions.push(expression)

      if (stopAtFirstFound) {
        return applicableExpressions
      }
    }
  }

  return applicableExpressions
}

export const evalApplicableExpressions = (survey, record, node, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = _getApplicableExpressions(survey, record, node, expressions, stopAtFirstFound)

  return applicableExpressions.map((expression) => ({
    expression,
    value: evalNodeQuery(survey, record, node, NodeDefExpression.getExpression(expression)),
  }))
}

export const evalApplicableExpression = (survey, record, nodeCtx, expressions) =>
  R.head(evalApplicableExpressions(survey, record, nodeCtx, expressions, true))
