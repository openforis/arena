/**
 * Server-side entry point of the label translation (route until Task 15, bulk job): see common/ai/tasks/translation.
 */
import { translateItems } from '@common/ai/tasks/translation'

import { createServerTextGenerator } from './serverTextGenerator'

/**
 * Translates a batch of survey labels.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {string} args.sourceLang - Source language code.
 * @param {string[]} args.targetLangs - Target language codes.
 * @param {Array<{id: string, text: string, kind?: string}>} args.items - Items to translate.
 * @param {Array} [args.glossary] - Existing translations to reuse.
 * @returns {Promise<{translations: Array<{id: string, byLang: object}>}>} The translations.
 */
export const translate = ({ user, sourceLang, targetLangs, items, glossary = [] }) =>
  translateItems({
    generateText: createServerTextGenerator({ user, feature: 'translation' }),
    sourceLang,
    targetLangs,
    items,
    glossary,
  })
