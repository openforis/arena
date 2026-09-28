/**
 * Service for the "suggest name, label and description" feature of the Data Explorer query manager.
 *
 * Pipeline:
 *   1. Load the survey (draft node defs, like the Data Explorer query execution does).
 *   2. Build the prompt with a compact description of the query selections.
 *   3. Call `modelClient.generate` (plain text), parse the JSON tolerantly and
 *      validate its shape with Zod; on failure, retry the prompt ONCE with the error fed back.
 *   4. Return the normalized name, the label and the description.
 */
import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'
import { Query } from '@common/model/query'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ModelClient from './modelClient'
import { buildDataQuerySummarizePrompt } from './prompts/dataQuerySummarize'
import { parseJsonResponse } from './responseParsers'

const logger = Log.getLogger('AiDataQuerySummarizeService')

const MAX_LANG_CODE_LEN = 16
const MAX_NAME_LEN = 40

const AiResultSchema = z.object({
  name: z.string().nullish(),
  label: z.string().min(1),
  description: z.string().nullish(),
})

/**
 * Normalizes the query name suggested by the model (only lowercase letters, digits and underscores).
 * @param {object} params - The parameters.
 * @param {string} [params.name] - The suggested name.
 * @param {string} [params.label] - The suggested label (used as fallback).
 * @returns {string} - The normalized name.
 */
export const normalizeQueryName = ({ name, label }: { name?: string | null; label?: string | null }) => {
  const source = StringUtils.isNotBlank(name) ? name : (label ?? '')
  const normalized = StringUtils.normalizeName(source).replace(/_+/g, '_').slice(0, MAX_NAME_LEN).replace(/^_|_$/g, '')
  return normalized || 'ai_query'
}

/**
 * Suggests a name, a label and a description for a Data Explorer query, based on its selections.
 * @param {object} params - The parameters.
 * @param {object} params.user - Acting user.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language used for labels and for the suggested label / description.
 * @param {object} params.query - The Data Explorer query.
 * @returns {Promise<{name: string, label: string, description: string}>} - The suggested summary props.
 */
export const summarize = async ({
  user,
  surveyId,
  cycle,
  lang,
  query,
}: {
  user: any
  surveyId: number
  cycle: string
  lang: string
  query: any
}) => {
  if (!query || typeof query !== 'object' || !Query.hasSelection(query)) {
    throw new SystemError('aiDataQueryEmpty')
  }
  if (lang && String(lang).length > MAX_LANG_CODE_LEN) {
    throw new SystemError('aiInputTooLong', { field: 'lang', limit: MAX_LANG_CODE_LEN })
  }

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle,
    draft: true,
    advanced: true,
  })
  if (!Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)) {
    throw new SystemError('aiDataQueryEmpty')
  }
  const surveyInfo = Survey.getSurveyInfo(survey)
  const langEffective =
    lang && (Survey.getLanguages(surveyInfo) as string[]).includes(lang) ? lang : Survey.getDefaultLanguage(surveyInfo)

  const runOnce = async (previousError = null) => {
    const { system, prompt } = buildDataQuerySummarizePrompt({ survey, query, lang: langEffective, previousError })
    const { text } = await ModelClient.generate({ user, feature: 'dataQuerySummarize', system, prompt })
    try {
      return { aiResult: AiResultSchema.parse(parseJsonResponse(text)), error: null }
    } catch (error) {
      return { aiResult: null, error: `invalid JSON answer: ${error?.message ?? error}` }
    }
  }

  let result = await runOnce()
  if (result.error) {
    logger.info(`dataQuerySummarize failed on first try: ${result.error}; retrying once`)
    result = await runOnce({ message: result.error })
  }
  if (result.error) {
    throw new SystemError('aiDataQuerySummaryInvalid')
  }
  const { name, label, description } = result.aiResult
  return {
    name: normalizeQueryName({ name, label }),
    label: label.trim(),
    description: description?.trim() ?? '',
  }
}
