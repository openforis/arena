/**
 * Draft of the add / edit provider dialog: the values typed so far and what is derived from them (the name, the model
 * and the address that are saved). Pure.
 */
import { withDefaultHttpScheme } from '@common/ai/localServerAddress'
import { normalizeProviderName } from '@common/ai/providerIds'

import { normalizeLocalProviderBaseUrl } from '@webapp/ai/engines/localProviders'
import { DEFAULT_LOCAL_SERVER_BASE_URL, stripTrailingSlashes } from '@webapp/ai/engines/localServerSettings'

import {
  getDefaultNameOf,
  getProviderTypeSpec,
  type ProviderDialogType,
  type ProviderTypeSpec,
  type SavedProvider,
} from './providerTypes'

export type ProviderDraft = {
  type: ProviderDialogType
  // empty: the provider gets the default name of its type
  name: string
  baseUrl: string
  // the model id (local providers: the model of the server)
  model: string
  modelFreeText: boolean
  // the user typed or picked the model (it was not filled in from the model list)
  modelTouched: boolean
  apiKey: string
  // the saved key is to be removed when saving (the key field stays empty)
  apiKeyRemoved: boolean
  // incremented on every key edit: a test of an older key never matches the draft
  apiKeyVersion: number
}

/**
 * Returns the URL without spaces and trailing slashes (the server compares endpoints the same way).
 * @param {string|null|undefined} url - URL.
 * @returns {string} The trimmed URL.
 */
export const trimUrl = (url: string | null | undefined): string => stripTrailingSlashes((url ?? '').trim())

/**
 * Returns true when two base URLs are the same endpoint.
 * @param {string|null} a - First URL.
 * @param {string|null} b - Second URL.
 * @returns {boolean} True when equal once trimmed.
 */
export const isSameBaseUrl = (a: string | null, b: string | null): boolean => trimUrl(a) === trimUrl(b)

/**
 * Returns the draft of a new provider of the type, or of the saved provider.
 * @param {object} params - Parameters.
 * @param {ProviderDialogType} params.type - Dialog type.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @returns {ProviderDraft} The draft (the key is never loaded: the server keeps it). A default name stays empty, so
 * the field shows the translated default as its placeholder.
 */
export const createDraft = ({
  type,
  saved,
}: {
  type: ProviderDialogType
  saved: SavedProvider | null
}): ProviderDraft => ({
  type,
  name: saved && saved.name !== getDefaultNameOf(getProviderTypeSpec(saved.dialogType)) ? saved.name : '',
  baseUrl: saved?.baseUrl ?? (type === 'local' ? DEFAULT_LOCAL_SERVER_BASE_URL : ''),
  model: saved?.model ?? '',
  modelFreeText: false,
  modelTouched: false,
  apiKey: '',
  apiKeyRemoved: false,
  apiKeyVersion: 0,
})

/**
 * Returns the name to save.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @returns {string} The typed name (normalized), else the type's default name.
 */
export const getDraftName = ({ spec, draft }: { spec: ProviderTypeSpec; draft: ProviderDraft }): string =>
  draft.name.trim() ? normalizeProviderName(draft.name, spec.providerType) : getDefaultNameOf(spec)

/**
 * Returns the model of the draft.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @returns {string|null} The trimmed model; null for a type without a model choice.
 */
export const getDraftModel = ({ spec, draft }: { spec: ProviderTypeSpec; draft: ProviderDraft }): string | null =>
  spec.supportsModelList ? draft.model.trim() : null

/**
 * Returns the URL of a local draft as it is stored (http:// added when typed without a scheme).
 * @param {ProviderDraft} draft - Draft.
 * @returns {string|null} The URL, or null when it is not a plain http(s) URL (no credentials, query or fragment).
 */
export const getLocalDraftUrl = (draft: ProviderDraft): string | null =>
  draft.baseUrl.trim() ? normalizeLocalProviderBaseUrl(withDefaultHttpScheme(draft.baseUrl)) : null

/**
 * Returns true when a local address was typed but is not a plain http(s) URL (the dialog then says why).
 * @param {ProviderDraft} draft - Draft.
 * @returns {boolean} True for a typed address that is refused.
 */
export const isLocalDraftUrlInvalid = (draft: ProviderDraft): boolean =>
  draft.baseUrl.trim() !== '' && getLocalDraftUrl(draft) === null

/**
 * Returns true when the user changed something: a name, the address, the key or the model. A model filled in from
 * the model list is not counted.
 * @param {object} params - Parameters.
 * @param {ProviderDraft} params.draft - Draft now.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @returns {boolean} True when closing the dialog would lose typed values.
 */
export const isDraftDirty = ({ draft, saved }: { draft: ProviderDraft; saved: SavedProvider | null }): boolean => {
  const initial = createDraft({ type: draft.type, saved })
  return (
    draft.name !== initial.name ||
    !isSameBaseUrl(draft.baseUrl, initial.baseUrl) ||
    draft.apiKey.trim().length > 0 ||
    draft.apiKeyRemoved ||
    (draft.modelTouched && draft.model.trim() !== initial.model.trim())
  )
}
