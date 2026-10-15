/**
 * Engine descriptions (label, model, limits) built from the provider entries and the capabilities. No AI SDK import.
 */
import { getLocalServerContextWindow, getLocalServerLimits } from './localServerProbe'
import type { AiLocalServerCapability, AiProviderEntry, AiSelectedEngine } from './types'

export const GATEWAY_MAX_STEPS = 10
export const DEFAULT_GATEWAY_MAX_PROMPT_CHARS = 200000 // A's AI_MAX_PROMPT_CHARS default

/**
 * Returns the engine description of a local provider, or null when its URL or hosting class is not known.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - The local provider (its id and the name the UI shows).
 * @param {AiLocalServerCapability} params.capability - Its probe (URL, chosen model, context size).
 * @returns {AiSelectedEngine|null} The description.
 */
export const getLocalServerEngineInfo = ({
  entry,
  capability,
}: {
  entry: Pick<AiProviderEntry, 'id' | 'name'>
  capability: AiLocalServerCapability
}): AiSelectedEngine | null => {
  const { baseUrl, hostingClass } = capability
  if (!baseUrl || !hostingClass) return null
  return {
    id: 'localServer',
    hostingClass,
    label: entry.name,
    model: capability.modelId,
    limits: getLocalServerLimits(capability.contextTokens),
    contextWindow: getLocalServerContextWindow(capability.contextTokens),
    providerId: entry.id,
  }
}

/**
 * Returns the engine description of a gateway provider, or null when its hosting class is not known.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - The provider (an account provider or Arena default).
 * @param {number|null} params.maxPromptChars - The gateway prompt cap of the instance, null when unknown.
 * @returns {AiSelectedEngine|null} The description.
 */
export const getGatewayEngineInfo = ({
  entry,
  maxPromptChars,
}: {
  entry: AiProviderEntry
  maxPromptChars: number | null
}): AiSelectedEngine | null => {
  if (!entry.hostingClass) return null
  return {
    id: 'gateway',
    hostingClass: entry.hostingClass,
    // Arena default is shown by its admin provider type ("OpenAI"), an account provider by the user's name for it
    label: entry.kind === 'arenaDefault' ? entry.type : entry.name,
    model: entry.model,
    limits: { maxPromptChars: maxPromptChars ?? DEFAULT_GATEWAY_MAX_PROMPT_CHARS, maxSteps: GATEWAY_MAX_STEPS },
    providerId: entry.id,
  }
}
