import * as R from 'ramda'

import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { RecordExpressionEvaluator } from '@openforis/arena-core'

export const evalNodeQuery = (survey, record, node, query) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const nodeContext = NodeDef.isEntity(nodeDef) ? node : Record.getParentNode(node)(record)
  const context = { survey, record, nodeContext, object: nodeContext }
  return new RecordExpressionEvaluator().evaluate(query, context)
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
