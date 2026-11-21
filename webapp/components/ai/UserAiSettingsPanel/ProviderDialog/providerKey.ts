/**
 * The API key rules of the add / edit provider dialog. A saved key is only used by the server on the endpoint it was
 * saved with: a changed base URL asks for the key again. Pure.
 */
import { isSameBaseUrl, type ProviderDraft } from './providerDraft'
import type { ProviderTypeSpec, SavedProvider } from './providerTypes'

export type KeyParams = { spec: ProviderTypeSpec; draft: ProviderDraft; saved: SavedProvider | null }

/**
 * Returns true when a key was typed.
 * @param {ProviderDraft} draft - Draft.
 * @returns {boolean} True when the key field is not blank.
 */
export const isApiKeyTyped = (draft: ProviderDraft): boolean => draft.apiKey.trim().length > 0

/**
 * Returns true when the saved key no longer applies because the base URL changed (the server never sends a saved key
 * to another endpoint, so the user types it again).
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {boolean} True when the saved key is cleared.
 */
export const isApiKeyCleared = ({ spec, draft, saved }: KeyParams): boolean =>
  !!saved?.hasApiKey && spec.requiresBaseUrl && !isSameBaseUrl(draft.baseUrl, saved.baseUrl)

/**
 * Returns true when the saved key can be used for the draft.
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {boolean} True for a readable key on the same endpoint that is not being removed.
 */
const hasUsableSavedKey = (params: KeyParams): boolean =>
  !!params.saved?.hasApiKey && params.saved.apiKeyReadable && !isApiKeyCleared(params) && !params.draft.apiKeyRemoved

/**
 * Returns true when the draft cannot be tested until a key is typed.
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {boolean} True when a key is missing.
 */
export const isApiKeyMissing = (params: KeyParams): boolean => {
  const { spec, draft, saved } = params
  if (!spec.hasApiKeyField || isApiKeyTyped(draft)) return false
  // a removed key is not typed again: only a type that works without a key can go on
  if (draft.apiKeyRemoved) return spec.requiresApiKey
  // a key saved for another address, or one the server cannot read, is never reused: it is typed again
  if (isApiKeyCleared(params) || (!!saved?.hasApiKey && !saved.apiKeyReadable)) return true
  return spec.requiresApiKey && !hasUsableSavedKey(params)
}

/**
 * Returns true when "Remove key" is offered: a saved key of a type that works without one (a cloud type is useless
 * without its key).
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {boolean} True when the saved key can be removed.
 */
export const canRemoveKey = (params: KeyParams): boolean => {
  const { spec, draft, saved } = params
  return (
    !!saved?.hasApiKey &&
    spec.hasApiKeyField &&
    !spec.requiresApiKey &&
    !draft.apiKeyRemoved &&
    !isApiKeyTyped(draft) &&
    !isApiKeyCleared(params)
  )
}

/**
 * Returns the `apiKey` field of a request: the typed key, an empty string to remove the saved key, else nothing (the
 * server keeps the saved key).
 * @param {ProviderDraft} draft - Draft.
 * @returns {{apiKey?: string}} The field.
 */
export const getApiKeyRequestField = (draft: ProviderDraft): { apiKey?: string } => {
  if (isApiKeyTyped(draft)) return { apiKey: draft.apiKey.trim() }
  return draft.apiKeyRemoved ? { apiKey: '' } : {}
}
