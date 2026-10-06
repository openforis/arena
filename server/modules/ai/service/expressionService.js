/**
 * Server-side entry point of the natural-language → Arena expression feature: see common/ai/tasks/expression.
 */
import { buildExplainExpressionRequest, generateExpression } from '@common/ai/tasks/expression'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ModelClient from './modelClient'
import { createServerTextGenerator } from './serverTextGenerator'

const fetchDraftSurvey = (surveyId) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, advanced: true, draft: true })

/**
 * Generates an Arena expression from a natural-language description.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID for permission + context fetch.
 * @param {string} args.nodeDefUuid - Target node def.
 * @param {string} args.expressionType - validation | applicableIf | defaultValue.
 * @param {string} args.description - User's plain-language description.
 * @returns {Promise<{ expression: string, explanation: string, isValid: boolean, parseError?: string }>}
 *   The generated expression and validation status.
 */
export const generate = async ({ user, surveyId, nodeDefUuid, expressionType, description }) =>
  generateExpression({
    generateText: createServerTextGenerator({ user, feature: 'expressionGenerate' }),
    survey: await fetchDraftSurvey(surveyId),
    nodeDefUuid,
    expressionType,
    description,
  })

/**
 * Streams a plain-language explanation of an existing Arena expression
 * for display in a side panel. Returns the Vercel AI SDK stream handle
 * whose `textStream` async-iterates over chunks.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.nodeDefUuid - Target node def UUID.
 * @param {string} args.expression - The expression to explain.
 * @param {string} [args.errorMessage] - Optional error to diagnose.
 * @param {AbortSignal} [args.signal] - Cancellation signal from the route.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The streaming result.
 */
export const explain = async ({ user, surveyId, nodeDefUuid, expression, errorMessage, signal }) => {
  const request = buildExplainExpressionRequest({
    survey: await fetchDraftSurvey(surveyId),
    nodeDefUuid,
    expression,
    errorMessage,
  })
  return ModelClient.stream({ user, feature: 'expressionExplain', ...request, signal })
}
