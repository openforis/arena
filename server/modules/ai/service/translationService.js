/**
 * Service for the survey-label translation feature (Tier 1 #1).
 *
 * Pipeline:
 *   1. Validate inputs.
 *   2. Build prompt asking for JSON of shape `{ translations: [...] }`.
 *   3. Call `modelClient.generate` (plain text). The structured-output
 *      path was dropped because tiny local models 400 even when asked
 *      for response_format=json_object — confirmed against LM Studio
 *      qwen3.5-4b. Plain text + an explicit output spec works
 *      everywhere.
 *   4. Parse the JSON tolerantly (strip code fences; extract the
 *      outermost object) and validate with the Zod schema.
 *   5. On parse / schema failure, retry the prompt ONCE with the
 *      previous bad output and the validation error fed back.
 */
import { z } from 'zod'

import SystemError from '@core/systemError'

import * as Log from '@server/log/log'

import * as ModelClient from './modelClient'
import { buildTranslationPrompt } from './prompts/translation'
import { parseJsonResponse } from './responseParsers'

const logger = Log.getLogger('AiTranslationService')

const ItemSchema = z.object({
  id: z.string(),
  text: z.string().max(2000),
  kind: z.string().optional(),
})

const ResultSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      byLang: z.record(z.string(), z.string()),
    })
  ),
})

const MAX_ITEMS_PER_CALL = 50
const MAX_TARGET_LANGS = 20
const MAX_LANG_CODE_LEN = 16
const MAX_GLOSSARY_ENTRIES = 50
const MAX_GLOSSARY_VALUE_LEN = 200

// Lang codes are normally short and predictable; the cap is loose enough
// to accept BCP-47-ish forms (`en`, `pt-BR`, `zh_Hans`) without trying to
// be a full validator. The point is to bound length, not parse locales.
const isValidLang = (lang) => typeof lang === 'string' && lang.length > 0 && lang.length <= MAX_LANG_CODE_LEN

const validateLangs = ({ sourceLang, targetLangs }) => {
  if (!sourceLang) throw new SystemError('aiTranslationSourceLangMissing')
  if (!isValidLang(sourceLang)) {
    throw new SystemError('aiInputTooLong', { field: 'sourceLang', limit: MAX_LANG_CODE_LEN })
  }
  if (!Array.isArray(targetLangs) || targetLangs.length === 0) {
    throw new SystemError('aiTranslationTargetLangsMissing')
  }
  if (targetLangs.length > MAX_TARGET_LANGS) {
    throw new SystemError('aiTranslationTooManyItems', { count: targetLangs.length, limit: MAX_TARGET_LANGS })
  }
  if (!targetLangs.every((lang) => isValidLang(lang))) {
    throw new SystemError('aiInputTooLong', { field: 'targetLangs', limit: MAX_LANG_CODE_LEN })
  }
}

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new SystemError('aiTranslationItemsMissing')
  }
  if (items.length > MAX_ITEMS_PER_CALL) {
    throw new SystemError('aiTranslationTooManyItems', { count: items.length, limit: MAX_ITEMS_PER_CALL })
  }
  for (const item of items) {
    ItemSchema.parse(item)
  }
}

const validateGlossaryEntryByLang = (byLang) => {
  for (const [lang, value] of Object.entries(byLang)) {
    if (!isValidLang(lang)) {
      throw new SystemError('aiInputTooLong', { field: 'glossary.byLang.key', limit: MAX_LANG_CODE_LEN })
    }
    if (typeof value === 'string' && value.length > MAX_GLOSSARY_VALUE_LEN) {
      throw new SystemError('aiInputTooLong', { field: 'glossary.byLang.value', limit: MAX_GLOSSARY_VALUE_LEN })
    }
  }
}

const validateGlossary = (glossary) => {
  if (!Array.isArray(glossary)) return
  if (glossary.length > MAX_GLOSSARY_ENTRIES) {
    throw new SystemError('aiTranslationTooManyItems', { count: glossary.length, limit: MAX_GLOSSARY_ENTRIES })
  }
  for (const g of glossary) {
    if (g?.source != null && String(g.source).length > MAX_GLOSSARY_VALUE_LEN) {
      throw new SystemError('aiInputTooLong', { field: 'glossary.source', limit: MAX_GLOSSARY_VALUE_LEN })
    }
    if (g?.byLang && typeof g.byLang === 'object') {
      validateGlossaryEntryByLang(g.byLang)
    }
  }
}

const validateTranslateArgs = ({ sourceLang, targetLangs, items, glossary }) => {
  validateLangs({ sourceLang, targetLangs })
  validateItems(items)
  validateGlossary(glossary)
}

/**
 * Translates a batch of survey labels.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {string} args.sourceLang - Source language code (e.g. "en").
 * @param {string[]} args.targetLangs - Target language codes (e.g. ["es", "fr"]).
 * @param {Array<{id:string, text:string, kind?:string}>} args.items - Items to translate.
 * @param {Array} [args.glossary] - Optional existing translations to reuse.
 * @returns {Promise<{translations: Array<{id:string, byLang: Record<string, string>}>}>}
 *   The translations grouped by item id.
 */
export const translate = async ({ user, sourceLang, targetLangs, items, glossary = [] }) => {
  validateTranslateArgs({ sourceLang, targetLangs, items, glossary })

  const runOnce = async (previousError) => {
    const { system, prompt } = buildTranslationPrompt({
      sourceLang,
      targetLangs,
      items,
      glossary,
      previousError,
    })
    const { text } = await ModelClient.generate({
      user,
      feature: 'translation',
      system,
      prompt,
    })
    const json = parseJsonResponse(text)
    return { result: ResultSchema.parse(json), rawText: text }
  }

  try {
    const { result } = await runOnce()
    return result
  } catch (firstError) {
    logger.info(
      `translation parse/validate failed on first try: ${firstError?.message || firstError}; retrying once with feedback`
    )
    const { result } = await runOnce({
      message: firstError?.message || String(firstError),
    })
    return result
  }
}
