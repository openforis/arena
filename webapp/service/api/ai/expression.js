/**
 * Frontend client for the natural-language → expression feature
 * (Tier 1 #2). Calls the backend's `/api/ai/survey/:surveyId/expression/*`
 * routes; result includes the generated expression, an explanation, and a
 * server-side parse-validation flag.
 */
import axios from 'axios'

import { streamSse } from './streaming'

/**
 * Generates an Arena expression from a plain-language description.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.nodeDefUuid - Target node def UUID.
 * @param {string} args.expressionType - validation | applicableIf | defaultValue.
 * @param {string} args.description - User's plain-language description.
 * @returns {Promise<{expression: string, explanation: string, isValid: boolean, parseError?: string}>}
 *   The result.
 */
export const generate = async ({ surveyId, nodeDefUuid, expressionType, description }) => {
  const { data } = await axios.post(`/api/ai/survey/${surveyId}/expression/generate`, {
    nodeDefUuid,
    expressionType,
    description,
  })
  return data
}

/**
 * Streams a plain-language explanation of an existing expression. Returns
 * a cancel function the caller MUST invoke to abort the underlying fetch.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.nodeDefUuid - Target node def UUID.
 * @param {string} args.expression - The expression to explain.
 * @param {string} [args.errorMessage] - Optional error to diagnose.
 * @param {Function} args.onChunk - Called with each text chunk.
 * @param {Function} [args.onDone] - Called when the stream completes.
 * @param {Function} [args.onError] - Called on transport / parse / server error.
 * @returns {Function} A `cancel` function that aborts the request.
 */
export const explainStream = ({ surveyId, nodeDefUuid, expression, errorMessage, onChunk, onDone, onError }) => {
  const params = new URLSearchParams({ nodeDefUuid, expression })
  if (errorMessage) params.set('errorMessage', errorMessage)
  const url = `/api/ai/survey/${surveyId}/expression/explain?${params.toString()}`
  return streamSse(url, { onChunk, onDone, onError })
}
