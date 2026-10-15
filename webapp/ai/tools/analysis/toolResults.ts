import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { getEffectiveQueryLang } from '@common/ai/tasks/dataQuery'

import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiToolContext } from '@webapp/ai/tools/types'

/**
 * Returns what a tool throws for a failed request: the expected failures become a failure the model can act on, a
 * timeout (queryTimeout, with the given hint) or a forbidden request (noPermission); other errors are returned as
 * they are (and the registry reports them as toolFailed).
 * @param {any} error - The error.
 * @param {string} timeoutHint - What the model can do after a timeout.
 * @returns {Error} The error to throw.
 */
export const toRequestFailure = (error: any, timeoutHint: string): Error => {
  if (error?.key === 'queryTimeout') return new AiToolFailure('queryTimeout', timeoutHint)
  if (error?.response?.status === 403) {
    return new AiToolFailure(
      'noPermission',
      'The user is not allowed to see this data. Do not retry: tell the user they lack the permission.'
    )
  }
  return error
}

/**
 * Returns the values every analysis tool needs.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {object} Survey, survey id and info, cycle, query language and whether analysis attributes are included.
 */
export const getAnalysisContext = (ctx: AiToolContext) => {
  const { survey } = ctx
  const surveyInfo = Survey.getSurveyInfo(survey)
  return {
    survey,
    surveyInfo,
    surveyId: Survey.getId(survey),
    cycle: ctx.cycle,
    lang: getEffectiveQueryLang({ survey, lang: ctx.lang }),
    includeAnalysis: Authorizer.canAnalyzeRecords(ctx.user, surveyInfo),
  }
}
