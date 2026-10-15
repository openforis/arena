/**
 * What the API key field shows for a draft: the placeholder and which hint applies. Pure.
 */
import type { ProviderDraft } from './providerDraft'
import { isApiKeyTyped } from './providerKey'
import type { SavedProvider } from './providerTypes'

export type ApiKeyFieldState = {
  // a saved key stays when the field is left blank
  keyKept: boolean
  // the saved key is removed when saving
  keyRemoved: boolean
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
  const keyRemoved = draft.apiKeyRemoved && !typed
  const unreadable = !!saved?.hasApiKey && !saved.apiKeyReadable
  const keyKept = !!saved?.hasApiKey && !keyCleared && !unreadable && !typed && !keyRemoved
  return {
    keyKept,
    keyRemoved,
    placeholderKey: keyKept ? 'userAiSettings:apiKeySaved' : 'userAiSettings:apiKeyPlaceholder',
    showClearedHint: keyCleared && !typed && !keyRemoved,
    showUnreadableHint: unreadable && !keyCleared && !typed && !keyRemoved,
  }
}
