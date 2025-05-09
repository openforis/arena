import { RecordExpressionEvaluator } from '@openforis/arena-core'

export const evalNodeQuery = async (survey, record, node, query) =>
  new RecordExpressionEvaluator().evalExpression({ survey, record, node, query })

export const evalApplicableExpressions = async (survey, record, node, expressions, stopAtFirstFound = false) =>
  new RecordExpressionEvaluator().evalApplicableExpressions({
    survey,
    record,
    nodeCtx: node,
    expressions,
    stopAtFirstFound,
  })

export const evalApplicableExpression = async (survey, record, nodeCtx, expressions) =>
  new RecordExpressionEvaluator().evalApplicableExpression({ survey, record, nodeCtx, expressions })
