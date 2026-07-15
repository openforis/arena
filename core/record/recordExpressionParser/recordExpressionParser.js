import { RecordExpressionEvaluator } from '@openforis/arena-core'

export const evalNodeQuery = async (survey, record, node, query, user) =>
  new RecordExpressionEvaluator().evalExpression({ survey, record, node, query, user })

export const evalApplicableExpressions = async (survey, record, node, expressions, stopAtFirstFound = false, user) =>
  new RecordExpressionEvaluator().evalApplicableExpressions({
    survey,
    record,
    nodeCtx: node,
    expressions,
    stopAtFirstFound,
    user,
  })

export const evalApplicableExpression = async (survey, record, nodeCtx, expressions, user) =>
  new RecordExpressionEvaluator().evalApplicableExpression({ survey, record, nodeCtx, expressions, user })
