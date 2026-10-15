/**
 * What the add / edit provider dialog saves: the request body of an account provider, the stored entry of a local one
 * and when "Add provider" / "Save" is enabled. Pure.
 */
import { ARENA_DEFAULT_PROVIDER_ID } from '@common/ai/providerIds'

import type { LocalProvider } from '@webapp/ai/engines/localProviders'
import type { AiProviderRequest } from '@webapp/service/api/ai/providers'

import { getDraftModel, getDraftName, getLocalDraftUrl, isSameBaseUrl, type ProviderDraft } from './providerDraft'
import { getApiKeyRequestField, isApiKeyTyped, type KeyParams } from './providerKey'
import { type DraftTest, isTestPassed } from './providerTest'
import { getProviderTypeSpec, type ProviderTypeSpec, type SavedProvider } from './providerTypes'

/**
 * Returns the body of the provider requests (test, models, add, edit) for an account draft.
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {AiProviderRequest} The body: `id` only when editing, `apiKey` only when typed ('' removes the saved key).
 */
export const buildAccountRequest = ({ spec, draft, saved }: KeyParams): AiProviderRequest => ({
  ...(saved ? { id: saved.id } : {}),
  type: spec.providerType,
  name: getDraftName({ spec, draft }),
  model: getDraftModel({ spec, draft }),
  baseUrl: spec.requiresBaseUrl ? draft.baseUrl.trim() : null,
  ...getApiKeyRequestField(draft),
})

/**
 * Returns true when the model, the endpoint or the key of a saved provider changed.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {SavedProvider} params.saved - Saved provider.
 * @returns {boolean} True when the changes need a test.
 */
const isConnectionChanged = ({
  spec,
  draft,
  saved,
}: {
  spec: ProviderTypeSpec
  draft: ProviderDraft
  saved: SavedProvider
}): boolean => {
  const savedModel = spec.supportsModelList ? (saved.model ?? '') : ''
  return (
    !isSameBaseUrl(draft.baseUrl, saved.baseUrl) ||
    (getDraftModel({ spec, draft }) ?? '') !== savedModel ||
    isApiKeyTyped(draft) ||
    draft.apiKeyRemoved
  )
}

/**
 * Returns true when "Add provider" / "Save" is enabled: a passing test of the current values, or (edit) a change of
 * the name only.
 * @param {object} params - Spec, draft, saved provider and the last test.
 * @returns {boolean} True when the draft can be saved.
 */
export const canSaveDraft = ({ spec, draft, saved, test }: KeyParams & { test: DraftTest | null }): boolean => {
  if (saved && !isConnectionChanged({ spec, draft, saved })) {
    // a new name only: saved without a test (the server keeps the connection as it is)
    return getDraftName({ spec, draft }) !== saved.name
  }
  return isTestPassed({ test, spec, draft })
}

/**
 * Returns the local provider list after saving the draft (a new provider last, an edited one in its place).
 * @param {object} params - Parameters.
 * @param {LocalProvider[]} params.providers - Stored providers.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {string} params.newId - Id for a new provider (`local:<uuid>`).
 * @returns {{providers: LocalProvider[], provider: LocalProvider}|null} The list and the saved entry; null for an
 * invalid URL.
 */
export const buildLocalProviderSave = ({
  providers,
  saved,
  draft,
  newId,
}: {
  providers: LocalProvider[]
  saved: SavedProvider | null
  draft: ProviderDraft
  newId: string
}): { providers: LocalProvider[]; provider: LocalProvider } | null => {
  const baseUrl = getLocalDraftUrl(draft)
  if (!baseUrl) return null
  const spec = getProviderTypeSpec('local')
  const provider: LocalProvider = {
    id: saved?.id ?? newId,
    name: getDraftName({ spec, draft }),
    baseUrl,
    modelId: draft.model.trim() || null,
  }
  const exists = providers.some((existing) => existing.id === provider.id)
  return {
    provider,
    providers: exists
      ? providers.map((existing) => (existing.id === provider.id ? provider : existing))
      : [...providers, provider],
  }
}

/**
 * Returns true when a new provider becomes the default: the default is Arena default and that is not set up. The
 * server applies the same rule to account providers itself.
 * @param {object} params - Parameters.
 * @param {string} params.defaultProviderId - Current default.
 * @param {boolean} params.arenaDefaultReady - The admin default is set up.
 * @returns {boolean} True when the new provider becomes the default.
 */
export const shouldBecomeDefault = ({
  defaultProviderId,
  arenaDefaultReady,
}: {
  defaultProviderId: string
  arenaDefaultReady: boolean
}): boolean => defaultProviderId === ARENA_DEFAULT_PROVIDER_ID && !arenaDefaultReady
