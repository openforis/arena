import { RecordExpressionEvaluator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

export const evalNodeQuery = (survey, record, node, query) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const nodeContext = NodeDef.isEntity(nodeDef) ? node : Record.getParentNode(node)(record)
  const context = { survey, record, nodeContext, object: nodeContext }
  return new RecordExpressionEvaluator().evaluate(query, context)
}

export const evalApplicableExpressions = (survey, record, node, expressions, stopAtFirstFound = false) =>
  new RecordExpressionEvaluator().evalApplicableExpressions({
    survey,
    record,
    nodeCtx: node,
    expressions,
    stopAtFirstFound,
  })

export const evalApplicableExpression = (survey, record, nodeCtx, expressions) =>
  new RecordExpressionEvaluator().evalApplicableExpression({ survey, record, nodeCtx, expressions })
