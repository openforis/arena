/**
 * Translation of survey labels. Plain text + tolerant JSON parsing + zod validation
 * (small local models reject the JSON response format), with one retry on an unusable answer.
 */
import { z } from 'zod'

import SystemError, { StatusCodes } from '@core/systemError'

import type { AiGenerateText } from '../llm'
import { AiLimits } from '../limits'
import { safeParseJsonResponse, withOneRetry } from '../parsing'
import type { RetryFeedback } from '../parsing'
import { buildTranslationPrompt } from '../prompts/translation'

export type AiTranslationItem = { id: string; text: string; kind?: string }
export type AiTranslationGlossaryEntry = { source?: string; byLang?: Record<string, string> }
export type AiTranslationResult = { translations: { id: string; byLang: Record<string, string> }[] }

const ResultSchema = z.object({
  translations: z.array(z.object({ id: z.string(), byLang: z.record(z.string(), z.string()) })),
})

const badRequest = (key: string, params?: object) => new SystemError(key, params, StatusCodes.BAD_REQUEST)

const assertMaxCount = (count: number, limit: number): void => {
  if (count > limit) throw badRequest('aiTranslationTooManyItems', { count, limit })
}

const assertMaxLength = (value: unknown, field: string, limit: number): void => {
  if (value != null && String(value).length > limit) throw badRequest('aiInputTooLong', { field, limit })
}

const isValidLang = (lang: unknown): boolean =>
  typeof lang === 'string' && lang.length > 0 && lang.length <= AiLimits.langCodeMaxChars

const validateLangs = (sourceLang: string, targetLangs: string[]): void => {
  if (!sourceLang) throw badRequest('aiTranslationSourceLangMissing')
  if (!isValidLang(sourceLang)) {
    throw badRequest('aiInputTooLong', { field: 'sourceLang', limit: AiLimits.langCodeMaxChars })
  }
  if (!Array.isArray(targetLangs) || targetLangs.length === 0) throw badRequest('aiTranslationTargetLangsMissing')
  assertMaxCount(targetLangs.length, AiLimits.translationMaxTargetLangs)
  if (!targetLangs.every(isValidLang)) {
    throw badRequest('aiInputTooLong', { field: 'targetLangs', limit: AiLimits.langCodeMaxChars })
  }
}

const validateItems = (items: AiTranslationItem[]): void => {
  if (!Array.isArray(items) || items.length === 0) throw badRequest('aiTranslationItemsMissing')
  assertMaxCount(items.length, AiLimits.translationMaxItems)
  for (const item of items) {
    assertMaxLength(item?.text, 'text', AiLimits.translationItemMaxChars)
  }
}

const validateGlossary = (glossary: AiTranslationGlossaryEntry[]): void => {
  if (!Array.isArray(glossary)) return
  assertMaxCount(glossary.length, AiLimits.translationMaxGlossaryEntries)
  const maxChars = AiLimits.translationGlossaryValueMaxChars
  for (const entry of glossary) {
    assertMaxLength(entry?.source, 'glossary.source', maxChars)
    for (const [lang, value] of Object.entries(entry?.byLang ?? {})) {
      if (!isValidLang(lang)) {
        throw badRequest('aiInputTooLong', { field: 'glossary.byLang.key', limit: AiLimits.langCodeMaxChars })
      }
      assertMaxLength(value, 'glossary.byLang.value', maxChars)
    }
  }
}

/**
 * Translates a batch of labels from the source language into the target languages.
 * @param {object} params - Parameters.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {string} params.sourceLang - Source language code.
 * @param {string[]} params.targetLangs - Target language codes.
 * @param {AiTranslationItem[]} params.items - Items to translate.
 * @param {AiTranslationGlossaryEntry[]} [params.glossary] - Existing translations to reuse.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<AiTranslationResult>} The translations by item id.
 */
export const translateItems = async ({
  generateText,
  sourceLang,
  targetLangs,
  items,
  glossary = [],
  signal,
}: {
  generateText: AiGenerateText
  sourceLang: string
  targetLangs: string[]
  items: AiTranslationItem[]
  glossary?: AiTranslationGlossaryEntry[]
  signal?: AbortSignal
}): Promise<AiTranslationResult> => {
  validateLangs(sourceLang, targetLangs)
  validateItems(items)
  validateGlossary(glossary)

  const run = async (previousError: RetryFeedback | null) => {
    const { system, prompt } = buildTranslationPrompt({ sourceLang, targetLangs, items, glossary, previousError })
    return safeParseJsonResponse(await generateText({ system, prompt, signal }), ResultSchema)
  }
  const { value } = await withOneRetry({
    run,
    getRetryFeedback: ({ error }) => (error ? { message: error } : null),
  })
  if (!value) throw new SystemError('aiTranslationInvalid', {}, StatusCodes.BAD_GATEWAY)
  return value
}
