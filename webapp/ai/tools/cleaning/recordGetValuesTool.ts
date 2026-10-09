import { z } from 'zod'

import type { AiTool } from '@webapp/ai/tools/types'
import { fitListToBudget, toolError, toRequestErrorResult } from '@webapp/ai/tools/analysis/toolResults'

import type { CleaningApi } from './cleaningApi'
import { canCleanseCurrentSurvey, getCleaningContext, resolveAttributeDefs } from './cleaningContext'
import { findRecordUuidByKeys } from './recordLookup'
import { getRecordValues } from './recordValues'
import type { CleaningI18n } from './validationRows'

const inputSchema = z.object({
  recordUuid: z.string().nullish().describe('UUID of the record.'),
  recordKeys: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .nullish()
    .describe('Values of the record key attributes, e.g. {"cluster_id": "12"}, when the UUID is unknown.'),
  attributes: z.array(z.string()).min(1).max(20).describe('Attribute names to read.'),
})

type Input = z.infer<typeof inputSchema>

const TIMEOUT_HINT = 'The record is too slow to load. Retry, or ask for fewer attributes.'

const common: Pick<AiTool, 'area' | 'dataClass' | 'effect' | 'requires'> = {
  area: ['cleaning'],
  dataClass: 'data',
  effect: 'read',
  requires: canCleanseCurrentSurvey,
}

/**
 * Creates record_getValues.
 * @param {object} deps - Dependencies.
 * @param {CleaningApi} deps.api - Cleaning API.
 * @param {Function} deps.getI18n - Returns the translator.
 * @returns {AiTool} The tool.
 */
export const createRecordGetValuesTool = ({
  api,
  getI18n,
}: {
  api: CleaningApi
  getI18n: () => CleaningI18n
}): AiTool<Input, unknown> => ({
  ...common,
  name: 'record_getValues',
  description:
    'Reads attributes of one record (by UUID or by its key values): for each node its UUID, the keys of its parent ' +
    'entity, its formatted and raw value and its validation messages. At most 100 nodes.',
  inputSchema,
  /**
   * Resolves the record, loads it once and reads the attributes.
   * @param {Input} input - Tool input.
   * @param {object} ctx - Tool context.
   * @returns {Promise<object>} The values, or a tool error.
   */
  execute: async ({ recordUuid, recordKeys, attributes }, ctx) => {
    const { survey, surveyId, cycle } = getCleaningContext(ctx)
    if (!recordUuid && !recordKeys) return toolError('recordRequired', 'Give recordUuid or recordKeys.')
    const { nodeDefs, unknownNames } = resolveAttributeDefs({ survey, names: [...new Set(attributes)] })
    if (unknownNames.length > 0) {
      return toolError('unknownAttribute', `Unknown attributes: ${unknownNames.join(', ')}. Use nodeDef_search.`)
    }
    const { signal } = ctx
    try {
      const lookup = recordUuid
        ? { recordUuid }
        : await findRecordUuidByKeys({ api, survey, surveyId, cycle, keys: recordKeys ?? {}, signal })
      if (!('recordUuid' in lookup)) return lookup
      const record = await api.fetchRecordAndNodes({ surveyId, recordUuid: lookup.recordUuid, signal })
      if (!record) return toolError('recordNotAvailable', 'The record does not exist or you may not see it.')
      return fitListToBudget(getRecordValues({ survey, cycle, record, nodeDefs, i18n: getI18n() }), 'nodes')
    } catch (error) {
      return toRequestErrorResult(error, TIMEOUT_HINT)
    }
  },
})
