import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import { assistantNodeDefTypes, createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'

import type { AiTool, AiToolContext } from '../types'
import { proposeChangeSet, summarySchema, textItemSchema, toTextMap } from './proposeChangeSet'
import { canEditSurveyTool, requireNodeDefByName, requireSurvey } from './surveyLookup'

const newNodeDefSchema = z.object({
  parentName: z
    .string()
    .min(1)
    .max(100)
    .describe('Parent entity: an existing one, or one created earlier in this list'),
  type: z.enum(assistantNodeDefTypes),
  name: z
    .string()
    .min(1)
    .max(40)
    .describe('Unique name: lowercase letters, digits and underscores, starting with a letter'),
  labels: z.array(textItemSchema).max(20).optional(),
  descriptions: z.array(textItemSchema).max(20).optional(),
  key: z.boolean().optional(),
  multiple: z.boolean().optional().describe('Entities are multiple unless false'),
  readOnly: z.boolean().optional(),
})

type NewNodeDefInput = z.infer<typeof newNodeDefSchema>

type CreateInput = { summary: string; nodeDefs: NewNodeDefInput[] }

/**
 * Converts the model's node definitions to create operations; a parent may be created earlier in the list.
 * @param {NewNodeDefInput[]} nodeDefs - Proposed node definitions.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {ChangeOperationDraft[]} The drafts, in order.
 */
const toCreateDrafts = (nodeDefs: NewNodeDefInput[], ctx: AiToolContext): ChangeOperationDraft[] => {
  const survey = requireSurvey(ctx)
  const createdByName = new Map<string, any>()
  const drafts: ChangeOperationDraft[] = []
  for (const item of nodeDefs) {
    const parent = createdByName.get(item.parentName) ?? requireNodeDefByName(survey, item.parentName)
    const nodeDef = createProposedNodeDef({
      parent,
      type: item.type,
      cycle: ctx.cycle ?? '0',
      name: item.name,
      labels: toTextMap(item.labels),
      descriptions: toTextMap(item.descriptions),
      key: item.key,
      multiple: item.multiple,
      readOnly: item.readOnly,
    })
    createdByName.set(item.name, nodeDef)
    drafts.push({ type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(parent) })
  }
  return drafts
}

export const nodeDefProposeCreateTool: AiTool<CreateInput> = {
  name: 'nodeDef_proposeCreate',
  description:
    'Proposes new node definitions (entities or attributes of type text, integer, decimal, boolean, date, time, ' +
    'coordinate). The proposal is validated like the form designer does and shown to the user as a card; nothing ' +
    'is saved until the user applies it. On invalidProposal, fix the listed issues and call again.',
  inputSchema: z.object({ summary: summarySchema, nodeDefs: z.array(newNodeDefSchema).min(1).max(20) }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'propose',
  requires: canEditSurveyTool,
  execute: async ({ summary, nodeDefs }, ctx) =>
    proposeChangeSet({ ctx, drafts: toCreateDrafts(nodeDefs, ctx), summary }),
}
