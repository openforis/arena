import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import { generateDataQuery } from '@common/ai/tasks/dataQuery'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { createServerTextGenerator } from './serverTextGenerator'

/**
 * Generates a Data Explorer query (route until Task 17): see common/ai/tasks/dataQuery.
 * @param {object} params - The parameters.
 * @param {object} params.user - Acting user.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language.
 * @param {string} params.description - The user's request.
 * @returns {Promise<{query: object, explanation: string}>} The query and its explanation.
 */
export const generate = async ({ user, surveyId, cycle, lang, description }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: true, advanced: true })
  return generateDataQuery({
    generateText: createServerTextGenerator({ user, feature: 'dataQueryGenerate' }),
    survey,
    cycle,
    lang,
    description,
    includeAnalysis: Authorizer.canAnalyzeRecords(user, Survey.getSurveyInfo(survey)),
  })
}
