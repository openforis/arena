import { RecordExpressionEvaluator } from '@openforis/arena-core'

export const evalNodeQuery = async (survey, record, node, query, user) =>
  new RecordExpressionEvaluator().evalExpression({ survey, record, node, query, user })

export const evalApplicableExpression = async (survey, record, nodeCtx, expressions, user) =>
  new RecordExpressionEvaluator().evalApplicableExpression({ survey, record, nodeCtx, expressions, user })
