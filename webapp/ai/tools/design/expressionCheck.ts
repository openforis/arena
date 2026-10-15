import { z } from 'zod'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { checkNodeDefExpression } from '@webapp/ai/changeSets/expressionProps'
import { nodeDefExpressionProps } from '@webapp/ai/changeSets/types'

import { canViewCurrentSurvey } from '../common/toolPermissions'
import { applyIfTextSchema, expressionTextSchema } from '../common/toolSchemas'
import type { AiTool } from '../types'
import { requireNodeDefByName, requireSurvey } from './surveyLookup'

const inputSchema = z.object({
  nodeDefName: z.string().min(1).max(100).describe('Node definition the expression belongs to'),
  prop: z.enum(nodeDefExpressionProps).describe('Expression property'),
  expression: expressionTextSchema,
  applyIf: applyIfTextSchema.optional().describe('Optional condition: the expression applies only when true'),
})

type ExpressionCheckInput = z.infer<typeof inputSchema>

export const expressionCheckTool: AiTool<ExpressionCheckInput> = {
  name: 'expression_check',
  description:
    'Checks an Arena expression (JavaScript-like syntax; refer to node definitions by name) as the expression ' +
    'editor does, in the context of a node definition property. Returns { ok: true } or { ok: false, errors }. ' +
    'Check every expression before proposing it.',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  execute: async ({ nodeDefName, prop, expression, applyIf }, ctx) => {
    const survey = requireSurvey(ctx)
    const nodeDef = requireNodeDefByName(survey, nodeDefName)
    const errors = await checkNodeDefExpression({
      survey,
      nodeDef,
      prop,
      expression: NodeDefExpression.createExpression({ expression, applyIf: applyIf || undefined }),
      t: ctx.t,
    })
    return errors.length === 0 ? { ok: true } : { ok: false, errors }
  },
}
