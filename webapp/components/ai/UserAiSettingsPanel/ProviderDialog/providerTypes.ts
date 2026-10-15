/**
 * The provider types of the add / edit dialog: their rules, the groups of step 1, the placeholders and the provider
 * the edit dialog opens with. Pure.
 */
import { AiProvider } from '@common/ai/aiProvider'
import { isOrgHostedUrl } from '@common/ai/localServerAddress'
import { getDefaultProviderName, LOCAL_PROVIDER_TYPE } from '@common/ai/providerIds'

import type { AiPublicProvider } from '@webapp/ai/engines/providerEntries'
import type { AiProviderEntry } from '@webapp/ai/engines/types'

// placeholders by stored provider type
export const BASE_URL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openaiCompatible]: 'https://openrouter.ai/api/v1',
  [AiProvider.vercelAiSdk]: 'https://your-app.example.com/api/chat',
}

export const MODEL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openai]: 'gpt-4o-mini',
  [AiProvider.anthropic]: 'claude-haiku-4-5',
  [AiProvider.google]: 'gemini-2.0-flash',
  [AiProvider.openaiCompatible]: 'llama3.3:70b',
}

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

export const ORG_SERVER_NAME = 'Organisation server'

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
 * Returns the name a provider of the type gets when none is typed: this is what is stored (English), and a name equal
 * to it is shown translated (see providerNames).
 * @param {ProviderTypeSpec} spec - Type spec.
 * @returns {string} The default name.
 */
export const getDefaultNameOf = (spec: ProviderTypeSpec): string =>
  spec.value === 'orgServer' ? ORG_SERVER_NAME : getDefaultProviderName(spec.providerType)
