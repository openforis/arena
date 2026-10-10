import { z } from 'zod'
import { Dates } from '@openforis/arena-core'

import type { AiTool } from '@webapp/ai/tools/types'
import { fitListToBudget, toolError, toRequestErrorResult } from '@webapp/ai/tools/analysis/toolResults'
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

// same limit as the server's batch endpoint (records per Apply)
const RECORDS_PER_PROPOSAL_MAX = 50

const TIMEOUT_HINT = 'Loading the records is too slow. Retry with fewer edits.'

const common: Pick<AiTool, 'area' | 'dataClass' | 'effect' | 'requires'> = {
  area: ['cleaning'],
  dataClass: 'data',
  effect: 'propose',
  requires: canCleanseCurrentSurvey,
}

const invalidProposal = (message: string, issues: { operation: number; field: string; message: string }[]) => ({
  error: { ...fitListToBudget({ code: 'invalidProposal', message, issues }, 'issues') },
})

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
  ...common,
  name: 'records_proposeEdits',
  description:
    'Proposes attribute value corrections in records, shown to the user as a change set to review and apply. ' +
    `Fix one pattern per call, at most ${RECORD_EDITS_MAX} edits. Edits the user may not make, invalid values and ` +
    'unchanged values are returned in `rejected`. A hierarchical code is resolved against the record as it is now: ' +
    'when a parent code and its child code both change, put the child edit in a separate, later change set, ' +
    'once the parent edit is applied.',
  inputSchema,
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
    if (new Set(edits.map((edit) => edit.recordUuid)).size > RECORDS_PER_PROPOSAL_MAX) {
      return invalidProposal('Too many records in one change set.', [
        {
          operation: 0,
          field: 'tooManyRecords',
          message: `At most ${RECORDS_PER_PROPOSAL_MAX} records per change set: split into smaller change sets.`,
        },
      ])
    }
    const { survey, surveyId, cycle, lang } = getCleaningContext(ctx)
    if (!cycle) return toolError('noCycle', 'No survey cycle is selected: ask the user to open one.')
    try {
      const { drafts, rejected } = await buildRecordEditProposal({
        api,
        i18n: getI18n(),
        user: ctx.user,
        survey,
        surveyId,
        cycle,
        lang,
        timezoneOffset: Dates.getTimezoneOffset(),
        signal: ctx.signal,
        edits: edits.map((edit) => ({ ...edit, value: edit.value ?? null })),
      })
      if (drafts.length === 0) {
        return invalidProposal(
          'No edit can be proposed.',
          rejected.map(({ index, code, message }) => ({ operation: index, field: code, message }))
        )
      }
      const changeSet = buildChangeSet({ drafts, survey, summary })
      ctx.onChangeSet(changeSet)
      // `operations` is what the history note of the agent reads
      const result = { changeSetId: changeSet.id, proposed: drafts.length, operations: drafts.length, rejected }
      return { ...fitListToBudget(result, 'rejected'), shownToUser: true }
    } catch (error) {
      return toRequestErrorResult(error, TIMEOUT_HINT)
    }
  },
})
