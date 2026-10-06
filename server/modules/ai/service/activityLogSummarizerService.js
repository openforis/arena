/**
 * Activity log summary route (until Task 16): fetches the latest entries and streams the summary.
 */
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import { AiLimits } from '@common/ai/limits'
import { buildActivityLogSummaryRequest } from '@common/ai/tasks/activityLog'

import * as ModelClient from './modelClient'

/**
 * Streams a plain-language summary of the latest activity log entries of the survey.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID.
 * @param {AbortSignal} [args.signal] - Cancellation signal.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The streaming result.
 */
export const summarize = async ({ user, surveyId, signal }) => {
  if (!surveyId) throw new SystemError('aiActivityLogSurveyMissing')
  const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
  const surveyName = Survey.getName(surveyInfo) || `survey-${surveyId}`
  // orderBy is the sort direction only (the column is fixed in the SQL)
  const entries = await ActivityLogManager.fetch({
    user,
    surveyId,
    limit: AiLimits.activityLogMaxEntries,
    orderBy: 'DESC',
  })
  const request = buildActivityLogSummaryRequest({ surveyName, entries })
  return ModelClient.stream({ user, feature: 'activityLogSummary', ...request, signal })
}
