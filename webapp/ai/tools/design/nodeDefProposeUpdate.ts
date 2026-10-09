import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import { getBasicPropValue } from '@webapp/ai/changeSets/operations'
import { nodeDefBasicProps, type ChangeOperationDraft, type NodeDefBasicProp } from '@webapp/ai/changeSets/types'

import { AiToolFailure } from '../toolFailure'
import type { AiTool, AiToolContext } from '../types'
import { proposeChangeSet, summarySchema } from './proposeChangeSet'
import { canEditSurveyTool, requireNodeDefByName, requireSurvey } from './surveyLookup'

type UpdateChange = { nodeDefName: string; prop: NodeDefBasicProp; value?: string | boolean }

type UpdateInput = { summary: string; changes: UpdateChange[] }

const checkValueType = ({ prop, value }: UpdateChange): void => {
  const expected = prop === 'name' ? 'string' : 'boolean'
  if (typeof value !== expected) {
    throw new AiToolFailure('invalidInput', `"${prop}" needs a ${expected} value.`)
  }
}

const toUpdateDrafts = (changes: UpdateChange[], ctx: AiToolContext): ChangeOperationDraft[] => {
  const survey = requireSurvey(ctx)
  return changes.map((change) => {
    checkValueType(change)
    const nodeDef = requireNodeDefByName(survey, change.nodeDefName)
    return {
      type: 'nodeDef.update',
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      prop: change.prop,
      from: getBasicPropValue(nodeDef, change.prop),
      to: change.value as string | boolean, // checked by checkValueType
    }
  })
}

export const nodeDefProposeUpdateTool: AiTool<UpdateInput> = {
  name: 'nodeDef_proposeUpdate',
  description:
    'Proposes changes to basic properties of existing node definitions: name (string), key, multiple, readOnly ' +
    '(booleans). Shown to the user as a card; nothing is saved until the user applies it. Use the current names.',
  inputSchema: z.object({
    summary: summarySchema,
    changes: z
      .array(
        z.object({
          nodeDefName: z.string().min(1).max(100),
          prop: z.enum(nodeDefBasicProps),
          value: z.union([z.string().min(1).max(40), z.boolean()]),
        })
      )
      .min(1)
      .max(50),
  }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'propose',
  requires: canEditSurveyTool,
  execute: async ({ summary, changes }, ctx) =>
    proposeChangeSet({ ctx, drafts: toUpdateDrafts(changes, ctx), summary }),
}
