import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import { getLabelValue } from '@webapp/ai/changeSets/operations'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'

import { canEditCurrentSurvey } from '../common/toolPermissions'
import type { AiTool, AiToolContext } from '../types'
import { proposeChangeSet, summarySchema } from './proposeChangeSet'
import { requireNodeDefByName, requireSurvey } from './surveyLookup'

const inputSchema = z.object({
  summary: summarySchema,
  items: z
    .array(
      z.object({
        nodeDefName: z.string().min(1).max(100),
        kind: z.enum(['labels', 'descriptions']),
        lang: z.string().min(2).max(10).describe('A language of the survey'),
        text: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(200),
})

type LabelsInput = z.infer<typeof inputSchema>

type LabelItem = LabelsInput['items'][number]

/**
 * Converts the model's items to label operations, recording the current texts.
 * @param {LabelItem[]} items - Proposed texts.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {ChangeOperationDraft[]} The drafts, in order.
 */
const toLabelDrafts = (items: LabelItem[], ctx: AiToolContext): ChangeOperationDraft[] => {
  const survey = requireSurvey(ctx)
  return items.map(({ nodeDefName, kind, lang, text }) => {
    const nodeDef = requireNodeDefByName(survey, nodeDefName)
    return {
      type: 'label.set',
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      kind,
      lang,
      from: getLabelValue(nodeDef, kind, lang),
      to: text,
    }
  })
}

export const labelsProposeSetTool: AiTool<LabelsInput> = {
  name: 'labels_proposeSet',
  description:
    'Proposes labels or descriptions of node definitions, for several node definitions and survey languages at ' +
    'once (write and translate labels). Shown to the user as a card; nothing is saved until the user applies it.',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canEditCurrentSurvey,
  execute: async ({ summary, items }, ctx) => proposeChangeSet({ ctx, drafts: toLabelDrafts(items, ctx), summary }),
}
