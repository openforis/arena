/**
 * Draft of the add / edit provider dialog (spec section 4.1): the provider types, the API key rules, the test that
 * must pass before saving, and the request bodies. A saved key is only used by the server on the endpoint it was
 * saved with: a changed base URL asks for the key again. Pure.
 */
import { AiProvider } from '@common/ai/aiProvider'
import { isOrgHostedUrl, withDefaultHttpScheme } from '@common/ai/localServerAddress'
import {
  ARENA_DEFAULT_PROVIDER_ID,
  getDefaultProviderName,
  LOCAL_PROVIDER_TYPE,
  normalizeProviderName,
} from '@common/ai/providerIds'

import { type LocalProvider, normalizeLocalProviderBaseUrl } from '@webapp/ai/engines/localProviders'
import { DEFAULT_LOCAL_SERVER_BASE_URL, stripTrailingSlashes } from '@webapp/ai/engines/localServerSettings'
import { getLocalServerTestView, type LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiPublicProvider } from '@webapp/ai/engines/providerEntries'
import type { AiLocalServerCapability, AiProviderEntry } from '@webapp/ai/engines/types'
import type { AiProviderRequest, AiProviderTestResponse } from '@webapp/service/api/ai/providers'

import { shouldShowLocalUrlHint as isLocalUrlWithoutAllowlist, type TFunction } from '../aiSettingsForm'

export type ProviderDialogType =
  'local' | 'orgServer' | 'openai' | 'anthropic' | 'google' | 'openai-compatible' | 'vercel-ai-sdk' | 'mock'

export type ProviderTypeSpec = {
  value: ProviderDialogType
  // the stored type: 'local' for local providers; an Organisation server is stored as openai-compatible
  providerType: string
  kind: 'account' | 'local'
  requiresBaseUrl: boolean
  requiresApiKey: boolean
  hasApiKeyField: boolean
  supportsModelList: boolean
}

export type ProviderTypeOption = { spec: ProviderTypeSpec; disabled: boolean }

export type ProviderTypeGroup = { key: 'local' | 'cloud'; options: ProviderTypeOption[] }

export type SavedProvider = {
  id: string
  kind: 'account' | 'local'
  dialogType: ProviderDialogType
  name: string
  model: string | null
  baseUrl: string | null
  hasApiKey: boolean
  apiKeyReadable: boolean
}

export type ProviderDraft = {
  type: ProviderDialogType
  name: string
  baseUrl: string
  // the model id (local providers: the model of the server)
  model: string
  modelFreeText: boolean
  apiKey: string
  // incremented on every key edit: a test of an older key never matches the draft
  apiKeyVersion: number
}

// the test of one set of values (key: buildTestKey of the tested draft)
export type DraftTest = { key: string; account: AiProviderTestResponse | null; local: LocalServerTestView | null }

const ORG_SERVER_NAME = 'Organisation server'

/**
 * Returns a type spec.
 * @param {ProviderDialogType} value - Dialog type.
 * @param {string} providerType - Stored type.
 * @param {object} flags - Kind and field flags.
 * @returns {ProviderTypeSpec} The spec.
 */
const typeSpec = (
  value: ProviderDialogType,
  providerType: string,
  flags: Omit<ProviderTypeSpec, 'value' | 'providerType'>
): ProviderTypeSpec => ({ value, providerType, ...flags })

const KEYED_CLOUD = {
  kind: 'account',
  requiresBaseUrl: false,
  requiresApiKey: true,
  hasApiKeyField: true,
  supportsModelList: true,
} as const

export const PROVIDER_TYPE_SPECS: ProviderTypeSpec[] = [
  typeSpec('local', LOCAL_PROVIDER_TYPE, {
    kind: 'local',
    requiresBaseUrl: true,
    requiresApiKey: false,
    hasApiKeyField: false,
    supportsModelList: true,
  }),
  typeSpec('orgServer', AiProvider.openaiCompatible, {
    kind: 'account',
    requiresBaseUrl: true,
    requiresApiKey: false,
    hasApiKeyField: true,
    supportsModelList: true,
  }),
  typeSpec('openai', AiProvider.openai, KEYED_CLOUD),
  typeSpec('anthropic', AiProvider.anthropic, KEYED_CLOUD),
  typeSpec('google', AiProvider.google, KEYED_CLOUD),
  typeSpec('openai-compatible', AiProvider.openaiCompatible, {
    kind: 'account',
    requiresBaseUrl: true,
    requiresApiKey: false,
    hasApiKeyField: true,
    supportsModelList: true,
  }),
  // a fixed chat endpoint: no key, no model choice
  typeSpec('vercel-ai-sdk', AiProvider.vercelAiSdk, {
    kind: 'account',
    requiresBaseUrl: true,
    requiresApiKey: false,
    hasApiKeyField: false,
    supportsModelList: false,
  }),
  // test servers only (AI_MOCK_PROVIDER_ENABLED): one model, no endpoint
  typeSpec('mock', 'mock', {
    kind: 'account',
    requiresBaseUrl: false,
    requiresApiKey: false,
    hasApiKeyField: false,
    supportsModelList: true,
  }),
]

/**
 * Returns the spec of a dialog type (Local server for an unknown one).
 * @param {string} value - Dialog type.
 * @returns {ProviderTypeSpec} The spec.
 */
export const getProviderTypeSpec = (value: string): ProviderTypeSpec =>
  PROVIDER_TYPE_SPECS.find((spec) => spec.value === value) ?? PROVIDER_TYPE_SPECS[0]

/**
 * Returns the types of step 1, in two groups: on your computer or network, and cloud with your API key.
 * @param {object} params - Parameters.
 * @param {string[]} params.allowlist - Org-hosted base URLs (Organisation server only when not empty).
 * @param {boolean} params.encryptionConfigured - The server can store API keys.
 * @param {boolean} params.mockEnabled - The server accepts the mock provider (e2e servers).
 * @returns {ProviderTypeGroup[]} The groups.
 */
export const getProviderTypeGroups = ({
  allowlist,
  encryptionConfigured,
  mockEnabled,
}: {
  allowlist: string[]
  encryptionConfigured: boolean
  mockEnabled: boolean
}): ProviderTypeGroup[] => {
  // without the secret no key can be saved: only the types that cannot work without one are disabled
  /** Returns a type option, disabled when it needs a key the server cannot store. */
  const option = (value: ProviderDialogType): ProviderTypeOption => {
    const spec = getProviderTypeSpec(value)
    return { spec, disabled: spec.requiresApiKey && !encryptionConfigured }
  }
  const localTypes: ProviderDialogType[] = allowlist.length > 0 ? ['local', 'orgServer'] : ['local']
  const cloudTypes: ProviderDialogType[] = ['openai', 'anthropic', 'google', 'openai-compatible', 'vercel-ai-sdk']
  if (mockEnabled) cloudTypes.push('mock')
  return [
    { key: 'local', options: localTypes.map(option) },
    { key: 'cloud', options: cloudTypes.map(option) },
  ]
}

/**
 * Returns the URL without spaces and trailing slashes (the server compares endpoints the same way).
 * @param {string|null|undefined} url - URL.
 * @returns {string} The trimmed URL.
 */
const trimUrl = (url: string | null | undefined): string => stripTrailingSlashes((url ?? '').trim())

/**
 * Returns true when two base URLs are the same endpoint.
 * @param {string|null} a - First URL.
 * @param {string|null} b - Second URL.
 * @returns {boolean} True when equal once trimmed.
 */
export const isSameBaseUrl = (a: string | null, b: string | null): boolean => trimUrl(a) === trimUrl(b)

/**
 * Returns the dialog type of a stored provider type.
 * @param {object} params - Parameters.
 * @param {string} params.type - Stored type.
 * @param {string|null} params.baseUrl - Base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {ProviderDialogType|null} The dialog type, or null for an unknown type.
 */
export const getDialogTypeOf = ({
  type,
  baseUrl,
  allowlist,
}: {
  type: string
  baseUrl: string | null
  allowlist: string[]
}): ProviderDialogType | null => {
  if (type === AiProvider.openaiCompatible && baseUrl && isOrgHostedUrl(baseUrl, allowlist)) return 'orgServer'
  const spec = PROVIDER_TYPE_SPECS.find((candidate) => candidate.value === type && candidate.value !== 'orgServer')
  return spec ? spec.value : null
}

/**
 * Returns the saved provider the edit dialog opens with.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - Provider entry (capabilities).
 * @param {AiPublicProvider[]} params.accountProviders - Account providers (GET /api/ai/settings), for the key flags.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {SavedProvider|null} The saved provider; null for Arena default or an unknown type.
 */
export const toSavedProvider = ({
  entry,
  accountProviders,
  allowlist,
}: {
  entry: AiProviderEntry
  accountProviders: AiPublicProvider[]
  allowlist: string[]
}): SavedProvider | null => {
  if (entry.kind === 'arenaDefault') return null
  const dialogType = getDialogTypeOf({ type: entry.type, baseUrl: entry.baseUrl, allowlist })
  if (!dialogType) return null
  const account = entry.kind === 'account' ? accountProviders.find((provider) => provider.id === entry.id) : undefined
  return {
    id: entry.id,
    kind: entry.kind,
    dialogType,
    name: entry.name,
    model: entry.model,
    baseUrl: entry.baseUrl,
    hasApiKey: !!account?.hasApiKey,
    apiKeyReadable: !!account?.apiKeyReadable,
  }
}

/**
 * Returns the draft of a new provider of the type, or of the saved provider.
 * @param {object} params - Parameters.
 * @param {ProviderDialogType} params.type - Dialog type.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @returns {ProviderDraft} The draft (the key is never loaded: the server keeps it).
 */
export const createDraft = ({
  type,
  saved,
}: {
  type: ProviderDialogType
  saved: SavedProvider | null
}): ProviderDraft => ({
  type,
  name: saved?.name ?? '',
  baseUrl: saved?.baseUrl ?? (type === 'local' ? DEFAULT_LOCAL_SERVER_BASE_URL : ''),
  model: saved?.model ?? '',
  modelFreeText: false,
  apiKey: '',
  apiKeyVersion: 0,
})

/**
 * Returns the name shown when the Name field is empty.
 * @param {ProviderTypeSpec} spec - Type spec.
 * @returns {string} The default name.
 */
export const getDefaultNameOf = (spec: ProviderTypeSpec): string =>
  spec.value === 'orgServer' ? ORG_SERVER_NAME : getDefaultProviderName(spec.providerType)

/**
 * Returns the name to save.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @returns {string} The typed name (normalized), else the type's name.
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
 * @returns {string|null} The URL, or null when it is not an http(s) URL.
 */
export const getLocalDraftUrl = (draft: ProviderDraft): string | null =>
  draft.baseUrl.trim() ? normalizeLocalProviderBaseUrl(withDefaultHttpScheme(draft.baseUrl)) : null

/**
 * Returns true when a key was typed.
 * @param {ProviderDraft} draft - Draft.
 * @returns {boolean} True when the key field is not blank.
 */
export const isApiKeyTyped = (draft: ProviderDraft): boolean => draft.apiKey.trim().length > 0

type KeyParams = { spec: ProviderTypeSpec; draft: ProviderDraft; saved: SavedProvider | null }

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
 * @returns {boolean} True for a readable key on the same endpoint.
 */
const hasUsableSavedKey = (params: KeyParams): boolean =>
  !!params.saved?.hasApiKey && params.saved.apiKeyReadable && !isApiKeyCleared(params)

/**
 * Returns true when the draft cannot be tested until a key is typed.
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {boolean} True when a key is missing.
 */
export const isApiKeyMissing = (params: KeyParams): boolean => {
  const { spec, draft, saved } = params
  if (!spec.hasApiKeyField || isApiKeyTyped(draft)) return false
  // a key saved for another address, or one the server cannot read, is never reused: it is typed again
  if (isApiKeyCleared(params) || (!!saved?.hasApiKey && !saved.apiKeyReadable)) return true
  return spec.requiresApiKey && !hasUsableSavedKey(params)
}

/**
 * Returns true when an account base URL points to this computer or the local network (and is not an org server):
 * the Arena server cannot reach it, a Local server can.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {string} params.baseUrl - Typed base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the hint shows.
 */
export const shouldShowLocalUrlHint = ({
  spec,
  baseUrl,
  allowlist,
}: {
  spec: ProviderTypeSpec
  baseUrl: string
  allowlist: string[]
}): boolean =>
  spec.kind === 'account' && spec.value !== 'orgServer' && isLocalUrlWithoutAllowlist({ spec, baseUrl, allowlist })

/**
 * Returns true when an Organisation server URL is typed but not on the allowlist.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {string} params.baseUrl - Typed base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the URL is refused.
 */
export const isOrgServerUrlRefused = ({
  spec,
  baseUrl,
  allowlist,
}: {
  spec: ProviderTypeSpec
  baseUrl: string
  allowlist: string[]
}): boolean => spec.value === 'orgServer' && !!baseUrl.trim() && !isOrgHostedUrl(baseUrl, allowlist)

/**
 * Returns true when the account draft has a base URL the server may call (or needs none).
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {string} params.baseUrl - Typed base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when usable.
 */
const isAccountBaseUrlUsable = (params: { spec: ProviderTypeSpec; baseUrl: string; allowlist: string[] }): boolean =>
  !params.spec.requiresBaseUrl ||
  (!!params.baseUrl.trim() && !shouldShowLocalUrlHint(params) && !isOrgServerUrlRefused(params))

/**
 * Returns true when the model list of an account draft can be requested.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {SavedProvider|null} params.saved - Saved provider.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the list can be fetched.
 */
export const canListModels = ({ spec, draft, saved, allowlist }: KeyParams & { allowlist: string[] }): boolean =>
  spec.kind === 'account' &&
  spec.supportsModelList &&
  isAccountBaseUrlUsable({ spec, baseUrl: draft.baseUrl, allowlist }) &&
  !isApiKeyMissing({ spec, draft, saved })

/**
 * Returns true when Test can run on the draft.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {SavedProvider|null} params.saved - Saved provider.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the draft is complete enough to test.
 */
export const canTestDraft = ({ spec, draft, saved, allowlist }: KeyParams & { allowlist: string[] }): boolean => {
  if (spec.kind === 'local') return getLocalDraftUrl(draft) !== null
  return isAccountBaseUrlUsable({ spec, baseUrl: draft.baseUrl, allowlist }) && !isApiKeyMissing({ spec, draft, saved })
}

/**
 * Returns the body of the provider requests (test, models, add, edit) for an account draft.
 * @param {KeyParams} params - Spec, draft and saved provider.
 * @returns {AiProviderRequest} The body: `id` only when editing, `apiKey` only when typed.
 */
export const buildAccountRequest = ({ spec, draft, saved }: KeyParams): AiProviderRequest => ({
  ...(saved ? { id: saved.id } : {}),
  type: spec.providerType,
  name: getDraftName({ spec, draft }),
  model: getDraftModel({ spec, draft }),
  baseUrl: spec.requiresBaseUrl ? draft.baseUrl.trim() : null,
  ...(isApiKeyTyped(draft) ? { apiKey: draft.apiKey.trim() } : {}),
})

/**
 * Returns the key of the values a test runs on; the key edit counter stands for the typed key.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @returns {string} The key.
 */
export const buildTestKey = ({ spec, draft }: { spec: ProviderTypeSpec; draft: ProviderDraft }): string => {
  // a local test lists the models: picking another listed model needs no new test
  if (spec.kind === 'local') return ['local', getLocalDraftUrl(draft) ?? ''].join('|')
  return [spec.value, trimUrl(draft.baseUrl), getDraftModel({ spec, draft }) ?? '', `k${draft.apiKeyVersion}`].join('|')
}

/**
 * Returns true when the test ran on the current values and passed.
 * @param {object} params - Parameters.
 * @param {DraftTest|null} params.test - Last test.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft now.
 * @returns {boolean} True when it passed.
 */
export const isTestPassed = ({
  test,
  spec,
  draft,
}: {
  test: DraftTest | null
  spec: ProviderTypeSpec
  draft: ProviderDraft
}): boolean => {
  if (!test || test.key !== buildTestKey({ spec, draft })) return false
  if (spec.kind === 'local') {
    const view = test.local
    return !!view?.reachable && !!draft.model && view.models.includes(draft.model)
  }
  return !!test.account?.ok
}

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
    isApiKeyTyped(draft)
  )
}

/**
 * Returns true when "Add provider" / "Save" is enabled: a passing test of the current values, or (edit) a change of
 * the name only.
 * @param {object} params - Parameters.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {ProviderDraft} params.draft - Draft.
 * @param {SavedProvider|null} params.saved - Saved provider.
 * @param {DraftTest|null} params.test - Last test.
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
 * Returns the model to choose after a local test.
 * @param {object} params - Parameters.
 * @param {boolean} params.reachable - The server answered.
 * @param {string[]} params.models - Models it lists.
 * @param {string} params.model - Chosen model.
 * @returns {string} The chosen model when listed, else the first listed one; unchanged when unreachable.
 */
export const pickLocalModel = ({
  reachable,
  models,
  model,
}: {
  reachable: boolean
  models: string[]
  model: string
}): string => {
  if (!reachable || models.includes(model)) return model
  return models[0] ?? model
}

/**
 * Returns the options of the local Model select.
 * @param {object} params - Parameters.
 * @param {LocalServerTestView|null} params.view - Result shown.
 * @param {string} params.model - Chosen model.
 * @returns {string[]} The listed models, with the chosen one first when it is not listed.
 */
export const listLocalModels = ({ view, model }: { view: LocalServerTestView | null; model: string }): string[] => {
  const listed = view?.models ?? []
  return model && !listed.includes(model) ? [model, ...listed] : listed
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
 * Returns true when a new provider becomes the default (spec 4.1: the default is Arena default and that is not set
 * up). The server applies the same rule to account providers itself.
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

/**
 * Returns the test of a saved local provider from the app's last probe of it, so the edit dialog opens with its
 * result and a model change needs no new test.
 * @param {object} params - Parameters.
 * @param {SavedProvider|null} params.saved - Saved provider.
 * @param {AiLocalServerCapability|null} params.capability - Its capability (capabilities.local[id]).
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {string} params.pageProtocol - Protocol of the Arena page.
 * @returns {DraftTest|null} The test, or null when the server was not probed.
 */
export const getInitialLocalTest = ({
  saved,
  capability,
  allowlist,
  pageProtocol,
}: {
  saved: SavedProvider | null
  capability: AiLocalServerCapability | null
  allowlist: string[]
  pageProtocol: string
}): DraftTest | null => {
  if (saved?.kind !== 'local' || !saved.baseUrl || !capability || capability.reachable === null) return null
  const { reachable, models, contextTokens, error } = capability
  const draft = createDraft({ type: 'local', saved })
  return {
    key: buildTestKey({ spec: getProviderTypeSpec('local'), draft }),
    account: null,
    local: getLocalServerTestView({
      probe: { reachable, models, contextTokens, error },
      baseUrl: saved.baseUrl,
      allowlist,
      pageProtocol,
    }),
  }
}

/**
 * Returns the text of an account test result; a refused local URL gets the hint to add a Local server.
 * @param {object} params - Parameters.
 * @param {AiProviderTestResponse} params.result - Result.
 * @param {ProviderTypeSpec} params.spec - Type spec.
 * @param {string} params.baseUrl - Tested base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The text.
 */
export const getAccountTestMessage = ({
  result,
  spec,
  baseUrl,
  allowlist,
  t,
}: {
  result: AiProviderTestResponse
  spec: ProviderTypeSpec
  baseUrl: string
  allowlist: string[]
  t: TFunction
}): string => {
  if (result.ok) return t('userAiSettings:dialog.testOk', { latencyMs: result.latencyMs })
  // server keys may already carry the namespace prefix
  const errorKey = (result.errorKey ?? '').replace(/^appErrors:/, '')
  if (errorKey === 'aiBaseUrlNotAllowed' && shouldShowLocalUrlHint({ spec, baseUrl, allowlist })) {
    return t('userAiSettings:dialog.localUrlHint')
  }
  // the params hold URLs and model ids: no HTML escaping
  if (errorKey) return t(`appErrors:${errorKey}`, { ...result.errorParams, interpolation: { escapeValue: false } })
  return result.errorMessage || t('appErrors:aiProviderUnavailable')
}
