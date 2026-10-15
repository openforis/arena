/**
 * What the API key field shows for a draft: the placeholder and which hint applies. Pure.
 */
import { isApiKeyTyped, type ProviderDraft, type SavedProvider } from './providerDraft'

export type ApiKeyFieldState = {
  // a saved key stays when the field is left blank
  keyKept: boolean
  // i18n key of the placeholder (text: bullets say nothing to a screen reader)
  placeholderKey: string
  showClearedHint: boolean
  showUnreadableHint: boolean
}

/**
 * Returns the state of the API key field.
 * @param {object} params - Parameters.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @param {boolean} params.keyCleared - The saved key no longer applies (the address changed).
 * @returns {ApiKeyFieldState} The state.
 */
export const getApiKeyFieldState = ({
  draft,
  saved,
  keyCleared,
}: {
  draft: ProviderDraft
  saved: SavedProvider | null
  keyCleared: boolean
}): ApiKeyFieldState => {
  const typed = isApiKeyTyped(draft)
  const unreadable = !!saved?.hasApiKey && !saved.apiKeyReadable
  const keyKept = !!saved?.hasApiKey && !keyCleared && !unreadable && !typed
  return {
    keyKept,
    placeholderKey: keyKept ? 'userAiSettings:apiKeySaved' : 'userAiSettings:apiKeyPlaceholder',
    showClearedHint: keyCleared && !typed,
    showUnreadableHint: unreadable && !keyCleared && !typed,
  }
}
