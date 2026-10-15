/**
 * The providers a user can pick, one entry each: account providers (GET /api/ai/settings), local
 * providers (this browser, with their probe) and Arena default (the admin default), each with a status.
 * Pure, no AI SDK import.
 */
import { aiHostingClasses, type AiHostingClass } from '@common/ai/policy'
import {
  ARENA_DEFAULT_PROVIDER_ID,
  isAccountProviderId,
  isAiProviderId,
  LOCAL_PROVIDER_TYPE,
} from '@common/ai/providerIds'

import type { LocalProvider } from './localProviders'
import type { AiLocalServerCapability, AiProviderEntry, AiProviderStatus } from './types'

// an account provider as GET /api/ai/settings returns it (never the key)
export type AiPublicProvider = {
  id: string
  type: string
  name: string
  model: string | null
  baseUrl: string | null
  hostingClass: string | null
  hasApiKey: boolean
  apiKeyReadable: boolean
  lastTestOk: boolean | null
  lastTestAt: string | null
}

// the admin default (AI_DEFAULT_*), null when the instance has none
export type AiAdminDefault = { provider: string; model: string | null; hostingClass: string | null }

// the UI shows the translated name (userAiSettings.list.arenaDefault)
export const ARENA_DEFAULT_NAME = 'Arena default'

/**
 * Returns the value when it is a hosting class.
 * @param {unknown} value - Raw value (from the server).
 * @returns {AiHostingClass|null} The hosting class, or null.
 */
const toHostingClass = (value: unknown): AiHostingClass | null =>
  (aiHostingClasses as readonly unknown[]).includes(value) ? (value as AiHostingClass) : null

/**
 * Returns the status of an account provider from its key and its last test.
 * @param {object} provider - Public entry.
 * @param {boolean} provider.hasApiKey - A key is stored.
 * @param {boolean} provider.apiKeyReadable - The stored key can be decrypted.
 * @param {boolean|null} provider.lastTestOk - Result of the last test, null when never tested.
 * @returns {AiProviderStatus} The status.
 */
export const getAccountProviderStatus = ({
  hasApiKey,
  apiKeyReadable,
  lastTestOk,
}: Pick<AiPublicProvider, 'hasApiKey' | 'apiKeyReadable' | 'lastTestOk'>): AiProviderStatus => {
  // a key the server can no longer read fails every call: the user must enter it again (no fallback)
  if ((hasApiKey && !apiKeyReadable) || lastTestOk === false) return 'notAvailable'
  return lastTestOk === true ? 'ready' : 'notTested'
}

/**
 * Returns the status of a local provider from its probe.
 * @param {AiLocalServerCapability|null} capability - Probe-based capability (null: not probed).
 * @returns {AiProviderStatus} The status.
 */
export const getLocalProviderStatus = (capability: AiLocalServerCapability | null): AiProviderStatus => {
  if (!capability || capability.reachable === null) return 'notTested'
  const { reachable, modelId, models } = capability
  return reachable && !!modelId && models.includes(modelId) ? 'ready' : 'notAvailable'
}

/**
 * Returns the entry of an account provider.
 * @param {AiPublicProvider} provider - Public entry.
 * @returns {AiProviderEntry} The entry.
 */
const toAccountEntry = (provider: AiPublicProvider): AiProviderEntry => ({
  id: provider.id,
  kind: 'account',
  type: provider.type,
  name: provider.name,
  model: provider.model ?? null,
  baseUrl: provider.baseUrl ?? null,
  hostingClass: toHostingClass(provider.hostingClass),
  status: getAccountProviderStatus(provider),
})

/**
 * Returns the entry of a local provider.
 * @param {LocalProvider} provider - Stored provider.
 * @param {AiLocalServerCapability|null} capability - Its capability (null: not probed).
 * @returns {AiProviderEntry} The entry.
 */
const toLocalEntry = (provider: LocalProvider, capability: AiLocalServerCapability | null): AiProviderEntry => ({
  id: provider.id,
  kind: 'local',
  type: LOCAL_PROVIDER_TYPE,
  name: provider.name,
  model: provider.modelId,
  baseUrl: provider.baseUrl,
  hostingClass: capability?.hostingClass ?? null,
  status: provider.addressInvalid ? 'notSetUp' : getLocalProviderStatus(capability),
  ...(provider.addressInvalid ? { addressInvalid: true } : {}),
})

/**
 * Returns the Arena default entry: always present; not set up without an admin default.
 * @param {AiAdminDefault|null} adminDefault - Admin default from the settings.
 * @returns {AiProviderEntry} The entry (type: the admin provider, e.g. "openai").
 */
export const getArenaDefaultEntry = (adminDefault: AiAdminDefault | null): AiProviderEntry => {
  const hostingClass = toHostingClass(adminDefault?.hostingClass)
  return {
    id: ARENA_DEFAULT_PROVIDER_ID,
    kind: 'arenaDefault',
    type: adminDefault?.provider ?? ARENA_DEFAULT_PROVIDER_ID,
    name: ARENA_DEFAULT_NAME,
    model: adminDefault?.model ?? null,
    baseUrl: null,
    hostingClass,
    status: hostingClass ? 'ready' : 'notSetUp',
  }
}

/**
 * Returns every provider entry: account providers, then local providers, then Arena default (always last).
 * @param {object} params - Parameters.
 * @param {AiPublicProvider[]} params.accountProviders - Account providers from the settings.
 * @param {LocalProvider[]} params.localProviders - Local providers of this browser.
 * @param {object} params.local - Capability of each local provider, by id.
 * @param {AiAdminDefault|null} params.adminDefault - Admin default.
 * @returns {AiProviderEntry[]} The entries.
 */
export const buildProviderEntries = ({
  accountProviders,
  localProviders,
  local,
  adminDefault,
}: {
  accountProviders: AiPublicProvider[]
  localProviders: LocalProvider[]
  local: Record<string, AiLocalServerCapability>
  adminDefault: AiAdminDefault | null
}): AiProviderEntry[] => [
  ...accountProviders.filter((provider) => isAccountProviderId(provider?.id)).map(toAccountEntry),
  ...localProviders.map((provider) => toLocalEntry(provider, local[provider.id] ?? null)),
  getArenaDefaultEntry(adminDefault),
]

/**
 * Returns the user's default provider id from the settings.
 * @param {object|null} settings - AI settings.
 * @returns {string} A valid provider id, else 'arena-default'.
 */
export const getDefaultProviderId = (settings: { defaultProviderId?: unknown } | null): string => {
  const id = settings?.defaultProviderId
  return isAiProviderId(id) ? id : ARENA_DEFAULT_PROVIDER_ID
}
