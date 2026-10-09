import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { getEffectiveQueryLang } from '@common/ai/tasks/dataQuery'

import type { AiToolContext } from '@webapp/ai/tools/types'

// below the 8,000 characters at which D1's wrapper cuts results
export const RESULT_MAX_CHARS = 7000

/**
 * Builds a structured tool error the model can recover from.
 * @param {string} code - Error code.
 * @param {string} message - Explanation for the model (English).
 * @returns {object} The error result.
 */
export const toolError = (code: string, message: string) => ({ error: { code, message } })

/**
 * Turns the expected request failures into a result the model can act on: a timeout (queryTimeout, with the
 * given hint) or a forbidden request (noPermission). Other errors are re-thrown.
 * @param {any} error - The error.
 * @param {string} timeoutHint - What the model can do after a timeout.
 * @returns {object} The error result.
 */
export const toRequestErrorResult = (error: any, timeoutHint: string) => {
  if (error?.key === 'queryTimeout') return toolError('queryTimeout', timeoutHint)
  if (error?.response?.status === 403) {
    return toolError(
      'noPermission',
      'The user is not allowed to see this data. Do not retry: tell the user they lack the permission.'
    )
  }
  throw error
}

/**
 * Removes items from the end of a list until the JSON of the result fits the budget.
 * @param {object} result - Tool result.
 * @param {string} key - Key of the list in the result.
 * @param {number} [maxChars] - Maximum JSON length.
 * @returns {object} The result (the same object when it already fits), with truncated: true when cut.
 */
export const fitListToBudget = <T extends Record<string, unknown>>(
  result: T,
  key: keyof T & string,
  maxChars: number = RESULT_MAX_CHARS
): T & { truncated?: boolean } => {
  const items = result[key] as unknown[]
  let fitted: T & { truncated?: boolean } = result
  let count = items.length
  while (count > 0 && JSON.stringify(fitted).length > maxChars) {
    count = Math.floor(count * 0.8)
    fitted = { ...result, [key]: items.slice(0, count), truncated: true } as T & { truncated?: boolean }
  }
  return fitted
}

/**
 * Returns true when a survey is open and the user can view it (the Explorer's server permission).
 * @param {AiToolContext} ctx - Tool context.
 * @returns {boolean} Whether the analysis tools can run.
 */
export const canViewCurrentSurvey = (ctx: AiToolContext): boolean => ctx.survey !== null && ctx.canViewSurvey

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
