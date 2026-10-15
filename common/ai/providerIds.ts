/**
 * AI provider ids, typed by prefix so any id says what kind of provider it names:
 * `arena-default` (the admin default), `acct:<id>` (stored on the account, called through the server gateway) and
 * `local:<id>` (stored in one browser, called from it).
 */
import { AiProvider } from './aiProvider'

export const ARENA_DEFAULT_PROVIDER_ID = 'arena-default'
export const ACCOUNT_PROVIDER_PREFIX = 'acct:'
export const LOCAL_PROVIDER_PREFIX = 'local:'
// fixed ids of the providers converted from the old single settings, so the conversion is stable across reads
export const LEGACY_ACCOUNT_PROVIDER_ID = `${ACCOUNT_PROVIDER_PREFIX}legacy`
export const LEGACY_LOCAL_PROVIDER_ID = `${LOCAL_PROVIDER_PREFIX}legacy`
export const LOCAL_PROVIDER_TYPE = 'local'
export const AI_PROVIDER_NAME_MAX_CHARS = 60

export type AiProviderKind = 'account' | 'local' | 'arenaDefault'
export type AiDefaultProviderOrigin = 'converted' | 'user'

// uuids and the fixed "legacy" body; no separators, so an id never escapes a URL path segment or a storage key
const ID_BODY_PATTERN = /^[A-Za-z0-9-]{1,64}$/

/**
 * Returns true when the value is a string with the prefix followed by a valid id body.
 * @param {unknown} id - Value to check (untrusted input allowed).
 * @param {string} prefix - Expected prefix.
 * @returns {boolean} Whether the id has the prefix and a valid body.
 */
const hasPrefixedBody = (id: unknown, prefix: string): id is string =>
  typeof id === 'string' && id.startsWith(prefix) && ID_BODY_PATTERN.test(id.slice(prefix.length))

/**
 * Returns true when the value is an account provider id (`acct:<id>`).
 * @param {unknown} id - Value to check.
 * @returns {boolean} Whether it is an account provider id.
 */
export const isAccountProviderId = (id: unknown): id is string => hasPrefixedBody(id, ACCOUNT_PROVIDER_PREFIX)

/**
 * Returns true when the value is a local provider id (`local:<id>`).
 * @param {unknown} id - Value to check.
 * @returns {boolean} Whether it is a local provider id.
 */
export const isLocalProviderId = (id: unknown): id is string => hasPrefixedBody(id, LOCAL_PROVIDER_PREFIX)

/**
 * Returns true when the value is any provider id.
 * @param {unknown} id - Value to check.
 * @returns {boolean} Whether it is a provider id.
 */
export const isAiProviderId = (id: unknown): id is string =>
  id === ARENA_DEFAULT_PROVIDER_ID || isAccountProviderId(id) || isLocalProviderId(id)

/**
 * Returns the kind of provider an id names.
 * @param {unknown} id - Provider id.
 * @returns {AiProviderKind|null} The kind, or null for a value that is not a provider id.
 */
export const getAiProviderKind = (id: unknown): AiProviderKind | null => {
  if (id === ARENA_DEFAULT_PROVIDER_ID) return 'arenaDefault'
  if (isAccountProviderId(id)) return 'account'
  if (isLocalProviderId(id)) return 'local'
  return null
}

/**
 * Builds an account provider id.
 * @param {string} body - Id body (a uuid).
 * @returns {string} The id.
 */
export const createAccountProviderId = (body: string): string => `${ACCOUNT_PROVIDER_PREFIX}${body}`

/**
 * Builds a local provider id.
 * @param {string} body - Id body (a uuid).
 * @returns {string} The id.
 */
export const createLocalProviderId = (body: string): string => `${LOCAL_PROVIDER_PREFIX}${body}`

// display names of the provider types; a provider's name defaults to its type's name
export const AI_PROVIDER_TYPE_NAMES: Record<string, string> = {
  [AiProvider.openai]: 'OpenAI',
  [AiProvider.anthropic]: 'Anthropic',
  [AiProvider.google]: 'Google',
  [AiProvider.openaiCompatible]: 'OpenAI-compatible',
  [AiProvider.vercelAiSdk]: 'Vercel AI SDK',
  [LOCAL_PROVIDER_TYPE]: 'Local server',
  mock: 'Mock',
}

/**
 * Returns the display name of a provider type.
 * @param {string} type - Provider type.
 * @returns {string} The name (the type itself when unknown).
 */
export const getDefaultProviderName = (type: string): string => AI_PROVIDER_TYPE_NAMES[type] ?? type

/**
 * Returns the name to store: whitespace collapsed, at most AI_PROVIDER_NAME_MAX_CHARS, else the type's name.
 * @param {unknown} name - Name typed by the user (untrusted).
 * @param {string} type - Provider type.
 * @returns {string} The name.
 */
export const normalizeProviderName = (name: unknown, type: string): string => {
  const cleaned =
    typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, AI_PROVIDER_NAME_MAX_CHARS).trim() : ''
  return cleaned || getDefaultProviderName(type)
}
