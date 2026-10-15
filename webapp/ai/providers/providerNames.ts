/**
 * The names of providers in the UI: a name equal to the default name of its type (stored in English when the user
 * typed none) is shown translated. Pure.
 */
import { getDefaultProviderName } from '@common/ai/providerIds'

type TFunction = (key: string, params?: Record<string, unknown>) => string

// the name an Organisation server gets when none is typed
export const ORG_SERVER_NAME = 'Organisation server'

// stored types that have a translated default name
const TRANSLATED_TYPES = new Set([
  'local',
  'openai',
  'anthropic',
  'google',
  'openai-compatible',
  'vercel-ai-sdk',
  'mock',
])

/**
 * Returns the key of the translated default name a stored name stands for.
 * @param {object} params - Parameters.
 * @param {string} params.name - Stored name.
 * @param {string} params.providerType - Stored provider type.
 * @returns {string|null} The key (`userAiSettings:defaultName.<type>`), or null for a name the user typed.
 */
export const getDefaultNameKey = ({ name, providerType }: { name: string; providerType: string }): string | null => {
  // an Organisation server is stored as openai-compatible
  if (providerType === 'openai-compatible' && name === ORG_SERVER_NAME) return 'userAiSettings:defaultName.orgServer'
  if (name === getDefaultProviderName(providerType) && TRANSLATED_TYPES.has(providerType)) {
    return `userAiSettings:defaultName.${providerType}`
  }
  return null
}

/**
 * Returns the name to show for a provider.
 * @param {object} params - Parameters.
 * @param {string} params.name - Stored name.
 * @param {string} params.providerType - Stored provider type.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The translated default name, or the name the user typed.
 */
export const getProviderNameText = ({
  name,
  providerType,
  t,
}: {
  name: string
  providerType: string
  t: TFunction
}): string => {
  const key = getDefaultNameKey({ name, providerType })
  return key ? t(key) : name
}
