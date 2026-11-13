/**
 * Default model of each provider, used when no model is specified:
 * the admin default model (AI_DEFAULT_MODEL) for the admin default provider, otherwise a built-in one.
 */
import { ENV } from '@core/processUtils'

import { AiProvider } from '@common/ai/aiProvider'

// Fast and cheap models, enough for the Arena AI features; keep them up to date.
const BUILT_IN_DEFAULT_MODELS: Record<string, string> = {
  [AiProvider.openai]: 'gpt-4o-mini',
  [AiProvider.anthropic]: 'claude-haiku-4-5',
  [AiProvider.google]: 'gemini-3.8-flash',
  [AiProvider.googleVertex]: 'gemini-3.8-flash',
}

/**
 * Returns the default model of the given provider.
 * @param {string} provider - The provider.
 * @returns {string|null} The default model, or null if the provider has none (e.g. openai-compatible).
 */
export const getDefaultModel = (provider: string): string | null => {
  if (provider && provider === ENV.aiDefaultProvider && ENV.aiDefaultModel) return ENV.aiDefaultModel
  return BUILT_IN_DEFAULT_MODELS[provider] ?? null
}

/**
 * Returns the default model of every provider that has one.
 * @returns {Record<string, string>} The default models, by provider.
 */
export const getDefaultModels = (): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const provider of Object.values(AiProvider)) {
    const model = getDefaultModel(provider)
    if (model) result[provider] = model
  }
  return result
}
