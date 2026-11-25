import type {
  ArenaNodeDefExpression,
  ArenaRecord,
  ArenaRecordNode,
  ArenaSurvey,
  ArenaUser,
} from '@openforis/arena-core'
import { RecordExpressionEvaluator } from '@openforis/arena-core'

export const evalNodeQuery = (
  survey: ArenaSurvey,
  record: ArenaRecord,
  node: ArenaRecordNode,
  query: string,
  user?: ArenaUser
) => new RecordExpressionEvaluator().evalExpression({ survey, record, node, query, user })

export const evalApplicableExpression = (
  survey: ArenaSurvey,
  record: ArenaRecord,
  nodeCtx: ArenaRecordNode,
  expressions: ArenaNodeDefExpression[],
  user?: ArenaUser
) => new RecordExpressionEvaluator().evalApplicableExpression({ survey, record, nodeCtx, expressions, user })
