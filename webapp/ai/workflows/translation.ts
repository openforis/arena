/**
 * Label translation (shared task, gateway model).
 */
import type { LanguageModel } from 'ai'

import {
  translateItems,
  type AiTranslationGlossaryEntry,
  type AiTranslationItem,
  type AiTranslationResult,
} from '@common/ai/tasks/translation'

import { resolveGatewayModel } from '../runtime/resolveModel'
import { createGatewayTextGenerator } from '../runtime/textGenerators'

/**
 * Translates labels into the target languages.
 * @param {object} params - Parameters (surveyId, sourceLang, targetLangs, items, glossary, signal, model).
 * @returns {Promise<AiTranslationResult>} The translations by item id.
 */
export const translateLabelsWorkflow = async ({
  surveyId,
  sourceLang,
  targetLangs,
  items,
  glossary,
  signal,
  model,
}: {
  surveyId: number
  sourceLang: string
  targetLangs: string[]
  items: AiTranslationItem[]
  glossary?: AiTranslationGlossaryEntry[]
  signal?: AbortSignal
  model?: LanguageModel
}): Promise<AiTranslationResult> => {
  const resolvedModel = await resolveGatewayModel({ model, feature: 'translation', surveyId })
  return translateItems({
    generateText: createGatewayTextGenerator(resolvedModel),
    sourceLang,
    targetLangs,
    items,
    glossary,
    signal,
  })
}
