import { z } from 'zod'
import { Dates } from '@openforis/arena-core'

import type { AiTool } from '@webapp/ai/tools/types'
import { toolError } from '@webapp/ai/tools/analysis/toolResults'
import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { RECORD_EDITS_MAX } from '@webapp/ai/changeSets/recordEdits/types'

import type { CleaningApi } from './cleaningApi'
import { canCleanseCurrentSurvey, getCleaningContext } from './cleaningContext'
import { buildRecordEditProposal } from './recordEditProposal'
import type { CleaningI18n } from './validationRows'

const valueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.null()])
  .describe(
    'New value as the user would type it: "12.5", "yes", a category code ("B", the parent code is taken from the ' +
      'record), a taxon code or scientific name, "x y srs" for coordinates, "2024-05-31", "14:30"; null clears it.'
  )

const inputSchema = z.object({
  summary: z.string().min(1).describe('One sentence for the user: the pattern this change set fixes.'),
  edits: z
    .array(
      z.object({
        recordUuid: z.string().describe('Record UUID (from validation_list, record_getValues or query_run).'),
        nodeUuid: z.string().describe('Node UUID of the attribute (from validation_list or record_getValues).'),
        value: valueSchema,
      })
    )
    .min(1),
})

type Input = z.infer<typeof inputSchema>

/**
 * Creates records_proposeEdits.
 * @param {object} deps - Dependencies.
 * @param {CleaningApi} deps.api - Cleaning API.
 * @param {Function} deps.getI18n - Returns the translator.
 * @returns {AiTool} The tool.
 */
export const createRecordsProposeEditsTool = ({
  api,
  getI18n,
}: {
  api: CleaningApi
  getI18n: () => CleaningI18n
}): AiTool<Input, unknown> => ({
  name: 'records_proposeEdits',
  description:
    'Proposes attribute value corrections in records, shown to the user as a change set to review and apply. ' +
    `Fix one pattern per call, at most ${RECORD_EDITS_MAX} edits. Edits the user may not make, invalid values and ` +
    'unchanged values are returned in `rejected`.',
  inputSchema,
  area: ['cleaning'],
  dataClass: 'data',
  effect: 'propose',
  requires: canCleanseCurrentSurvey,
  /**
   * Builds the change set and hands it to the conversation; nothing is written.
   * @param {Input} input - Tool input.
   * @param {object} ctx - Tool context.
   * @returns {Promise<object>} The proposal result, or a tool error.
   */
  execute: async ({ summary, edits }, ctx) => {
    if (edits.length > RECORD_EDITS_MAX) {
      return toolError(
        'tooManyEdits',
        `At most ${RECORD_EDITS_MAX} edits per change set: split into smaller change sets.`
      )
    }
    const { survey, surveyId, cycle, lang } = getCleaningContext(ctx)
    const { drafts, rejected } = await buildRecordEditProposal({
      api,
      i18n: getI18n(),
      user: ctx.user,
      survey,
      surveyId,
      cycle: cycle as string,
      lang,
      timezoneOffset: Dates.getTimezoneOffset(),
      edits: edits.map((edit) => ({ ...edit, value: edit.value ?? null })),
    })
    if (drafts.length === 0) {
      return {
        error: {
          code: 'invalidProposal',
          message: 'No edit can be proposed.',
          issues: rejected.map(({ index, code, message }) => ({ operation: index, field: code, message })),
        },
      }
    }
    const changeSet = buildChangeSet({ drafts, survey, summary })
    ctx.onChangeSet(changeSet)
    return { changeSetId: changeSet.id, proposed: drafts.length, rejected, shownToUser: true }
  },
})
