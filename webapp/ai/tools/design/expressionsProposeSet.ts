import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { getExpressionProp } from '@webapp/ai/changeSets/expressionProps'
import { nodeDefExpressionProps, type NodeDefExpressionProp } from '@webapp/ai/changeSets/types'

import { canEditCurrentSurvey } from '../common/toolPermissions'
import { applyIfTextSchema, expressionTextSchema } from '../common/toolSchemas'
import type { AiTool } from '../types'
import { proposeChangeSet, summarySchema, textItemSchema, toTextMap } from './proposeChangeSet'
import { requireNodeDefByName, requireSurvey } from './surveyLookup'

const inputSchema = z.object({
  summary: summarySchema,
  nodeDefName: z.string().min(1).max(100),
  prop: z.enum(nodeDefExpressionProps),
  expressions: z
    .array(
      z.object({
        expression: expressionTextSchema,
        applyIf: applyIfTextSchema.optional(),
        severity: z.enum(['error', 'warning']).optional(),
        messages: z.array(textItemSchema).max(20).optional().describe('Validation message by language'),
      })
    )
    .max(20)
    .describe('The complete new list; empty removes every expression'),
})

type ExpressionsInput = z.infer<typeof inputSchema>

type ExpressionItem = ExpressionsInput['expressions'][number]

/**
 * Builds an expression; severity and messages exist only on validation expressions.
 * @param {NodeDefExpressionProp} prop - Expression property.
 * @param {ExpressionItem} item - Proposed expression.
 * @returns {object} The expression.
 */
const toExpression = (prop: NodeDefExpressionProp, item: ExpressionItem) =>
  NodeDefExpression.createExpression({
    expression: item.expression,
    applyIf: item.applyIf || undefined,
    ...(prop === 'validations.expressions' ? { severity: item.severity, messages: toTextMap(item.messages) } : {}),
  })

export const expressionsProposeSetTool: AiTool<ExpressionsInput> = {
  name: 'expressions_proposeSet',
  description:
    'Proposes the full list of expressions of one expression property of a node definition (it replaces the ' +
    'current list: include the expressions to keep). defaultValues, validations.expressions: several allowed; ' +
    'applicable (relevant if), visibleIf, editableIf: one. severity and messages apply to validations only. ' +
    'Check each expression with expression_check first. Shown to the user as a card; nothing is saved until the ' +
    'user applies it.',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canEditCurrentSurvey,
  execute: async ({ summary, nodeDefName, prop, expressions }, ctx) => {
    const nodeDef = requireNodeDefByName(requireSurvey(ctx), nodeDefName)
    const draft = {
      type: 'expression.set' as const,
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      prop,
      from: getExpressionProp(nodeDef, prop),
      to: expressions.map((item) => toExpression(prop, item)),
    }
    return proposeChangeSet({ ctx, drafts: [draft], summary })
  },
}
