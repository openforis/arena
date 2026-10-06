import { summarizeDataQuery } from '@common/ai/tasks/dataQuery'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { createServerTextGenerator } from './serverTextGenerator'

/**
 * Suggests name, label and description of a Data Explorer query (route until Task 17).
 * @param {object} params - The parameters.
 * @param {object} params.user - Acting user.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language.
 * @param {object} params.query - The query.
 * @returns {Promise<{name: string, label: string, description: string}>} The suggestions.
 */
export const summarize = async ({ user, surveyId, cycle, lang, query }) =>
  summarizeDataQuery({
    generateText: createServerTextGenerator({ user, feature: 'dataQuerySummarize' }),
    survey: await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: true, advanced: true }),
    query,
    lang,
  })
