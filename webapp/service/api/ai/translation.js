/**
 * Frontend client for the survey-label translation feature (Tier 1 #1).
 */
import axios from 'axios'

/**
 * Enqueues a translation request. The server responds immediately with 202; the
 * result is delivered via the WebSocket `translationUpdate` event carrying the same `requestId`.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.requestId - Client-generated correlation ID.
 * @param {string} args.sourceLang - 2-letter source language code.
 * @param {string[]} args.targetLangs - Target language codes.
 * @param {Array<{id:string, text:string, kind?:string}>} args.items - Items to translate.
 * @param {Array} [args.glossary] - Optional glossary entries.
 * @returns {Promise<void>}
 */
export const translate = async ({ surveyId, requestId, sourceLang, targetLangs, items, glossary }) => {
  await axios.post(`/api/ai/survey/${surveyId}/translate`, {
    requestId,
    sourceLang,
    targetLangs,
    items,
    glossary,
  })
}
