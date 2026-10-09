import { I18nState } from '@webapp/store/system'

import type { AiTool } from '@webapp/ai/tools/types'

import { axiosCleaningApi, type CleaningApi } from './cleaningApi'
import { createRecordGetValuesTool } from './recordGetValuesTool'
import { createRecordsProposeEditsTool } from './recordsProposeEditsTool'
import { createValidationTools } from './validationTools'
import type { CleaningI18n } from './validationRows'

/**
 * Creates the tools of the cleaning area.
 * @param {object} deps - Dependencies.
 * @param {CleaningApi} deps.api - Cleaning API.
 * @param {Function} deps.getI18n - Returns the translator (validation messages).
 * @returns {AiTool[]} validation_summarize, validation_list, record_getValues, records_proposeEdits.
 */
export const createCleaningTools = (deps: {
  api: CleaningApi
  getI18n: () => CleaningI18n
}): AiTool<any, unknown>[] => [
  ...createValidationTools(deps),
  createRecordGetValuesTool(deps),
  createRecordsProposeEditsTool(deps),
]

export const cleaningTools = createCleaningTools({
  api: axiosCleaningApi,
  getI18n: () => I18nState.getI18n() as CleaningI18n,
})
