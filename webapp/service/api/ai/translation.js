/**
 * Frontend client for the survey-label translation feature (Tier 1 #1).
 */
import axios from 'axios'

/**
 * Translates a batch of labels from `sourceLang` into all `targetLangs`.
 * @param {object} args - Args.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.sourceLang - 2-letter source language code.
 * @param {string[]} args.targetLangs - Target language codes.
 * @param {Array<{id:string, text:string, kind?:string}>} args.items - Items to translate.
 * @returns {Promise<{translations: Array<{id:string, byLang: Record<string,string>}>}>}
 *   The translations, keyed by item id.
 */
export const translate = async ({ surveyId, sourceLang, targetLangs, items }) => {
  const { data } = await axios.post(`/api/ai/survey/${surveyId}/translate`, {
    sourceLang,
    targetLangs,
    items,
  })
  return data
}
