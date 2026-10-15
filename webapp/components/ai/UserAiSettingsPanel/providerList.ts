/**
 * Rows of the provider list (spec section 4): where tag, status pill, Default marker and ⋯ menu actions. Pure.
 */
import type { LocalProvider } from '@webapp/ai/engines/localProviders'
import type { AiProviderEntry, AiProviderStatus } from '@webapp/ai/engines/types'

import type { AiSettings, TFunction } from './aiSettingsForm'
import { getProviderNameText } from './providerNames'
import type { ProviderDialogContext } from './ProviderDialog/providerDialogState'
import type { StatusPillTone } from './StatusPill'

export type ProviderWhereKey = 'onDevice' | 'orgHosted' | 'cloudOwnKey' | 'cloud'

export type ProviderMenuAction = 'makeDefault' | 'test' | 'edit' | 'remove'

export type ProviderStatusPill = { tone: StatusPillTone; key: string }

export type ProviderRow = {
  entry: AiProviderEntry
  isDefault: boolean
  monogramType: string
  whereKey: ProviderWhereKey | null
  pill: ProviderStatusPill
  actions: ProviderMenuAction[]
}

// an icon and a text with every tone (StatusPill): never colour alone
const STATUS_PILLS: Record<AiProviderStatus, ProviderStatusPill> = {
  ready: { tone: 'ok', key: 'userAiSettings:status.ready' },
  notTested: { tone: 'warn', key: 'userAiSettings:status.notTested' },
  notAvailable: { tone: 'bad', key: 'userAiSettings:status.notAvailable' },
  notSetUp: { tone: 'warn', key: 'userAiSettings:status.notSetUp' },
}

const ARENA_DEFAULT_MONOGRAM = 'arena-default'

/**
 * Returns the where tag of a provider.
 * @param {Pick<AiProviderEntry, 'kind'|'hostingClass'>} entry - Provider entry.
 * @returns {ProviderWhereKey|null} The tag key (`userAiSettings:where.<key>`), or null when the hosting is not known.
 */
export const getProviderWhereKey = (entry: Pick<AiProviderEntry, 'kind' | 'hostingClass'>): ProviderWhereKey | null => {
  if (entry.hostingClass === 'onDevice') return 'onDevice'
  if (entry.hostingClass === 'orgHosted') return 'orgHosted'
  if (entry.hostingClass !== 'cloud') return null
  // only an account provider holds a key of the user
  return entry.kind === 'account' ? 'cloudOwnKey' : 'cloud'
}

/**
 * Returns the status pill of a provider status.
 * @param {AiProviderStatus} status - Status.
 * @returns {ProviderStatusPill} The tone and the i18n key.
 */
export const getProviderStatusPill = (status: AiProviderStatus): ProviderStatusPill =>
  STATUS_PILLS[status] ?? STATUS_PILLS.notAvailable

/**
 * Returns the type the monogram shows (Arena default has its own mark, whatever the admin provider is).
 * @param {Pick<AiProviderEntry, 'kind'|'type'>} entry - Provider entry.
 * @returns {string} The monogram type.
 */
export const getProviderMonogramType = (entry: Pick<AiProviderEntry, 'kind' | 'type'>): string =>
  entry.kind === 'arenaDefault' ? ARENA_DEFAULT_MONOGRAM : entry.type

/**
 * Returns the name shown for a provider (Arena default and the default names of the types are translated; the others
 * are the user's names).
 * @param {object} params - Parameters.
 * @param {Pick<AiProviderEntry, 'kind'|'name'|'type'>} params.entry - Provider entry.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The name.
 */
export const getProviderDisplayName = ({
  entry,
  t,
}: {
  entry: Pick<AiProviderEntry, 'kind' | 'name' | 'type'>
  t: TFunction
}): string =>
  entry.kind === 'arenaDefault'
    ? t('userAiSettings:list.arenaDefault')
    : getProviderNameText({ name: entry.name, providerType: entry.type, t })

/**
 * Returns the ⋯ menu actions of a row.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - Provider entry.
 * @param {boolean} params.isDefault - The provider is the default.
 * @returns {ProviderMenuAction[]} The actions (none: the menu is not shown).
 */
export const getProviderMenuActions = ({
  entry,
  isDefault,
}: {
  entry: AiProviderEntry
  isDefault: boolean
}): ProviderMenuAction[] => {
  const makeDefault: ProviderMenuAction[] = isDefault ? [] : ['makeDefault']
  // Arena default cannot be tested, edited or removed (spec section 1)
  if (entry.kind === 'arenaDefault') return makeDefault
  return [...makeDefault, 'test', 'edit', 'remove']
}

/**
 * Returns the rows of the list, in the order of the capabilities (account, local, Arena default last).
 * @param {object} params - Parameters.
 * @param {AiProviderEntry[]} params.providers - Provider entries.
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {ProviderRow[]} The rows.
 */
export const buildProviderRows = ({
  providers,
  defaultProviderId,
}: {
  providers: AiProviderEntry[]
  defaultProviderId: string
}): ProviderRow[] =>
  providers.map((entry) => {
    const isDefault = entry.id === defaultProviderId
    return {
      entry,
      isDefault,
      monogramType: getProviderMonogramType(entry),
      whereKey: getProviderWhereKey(entry),
      pill: getProviderStatusPill(entry.status),
      actions: getProviderMenuActions({ entry, isDefault }),
    }
  })

/**
 * Returns true when the default has no row: a local provider saved in another browser (spec section 9).
 * @param {object} params - Parameters.
 * @param {AiProviderEntry[]} params.providers - Provider entries (empty before the capabilities are loaded).
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {boolean} True when the default is missing here.
 */
export const isDefaultProviderMissing = ({
  providers,
  defaultProviderId,
}: {
  providers: AiProviderEntry[]
  defaultProviderId: string
}): boolean => providers.length > 0 && !providers.some((entry) => entry.id === defaultProviderId)

/**
 * Returns what the add / edit dialog needs from the settings and the capabilities.
 * @param {object} params - Parameters.
 * @param {AiSettings} params.settings - GET /api/ai/settings response.
 * @param {AiProviderEntry[]} params.providers - Provider entries.
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {ProviderDialogContext} The context.
 */
export const getProviderDialogContext = ({
  settings,
  providers,
  defaultProviderId,
}: {
  settings: Pick<AiSettings, 'orgHostedBaseUrls' | 'encryptionConfigured' | 'mockProviderEnabled'>
  providers: AiProviderEntry[]
  defaultProviderId: string
}): ProviderDialogContext => ({
  allowlist: Array.isArray(settings.orgHostedBaseUrls) ? settings.orgHostedBaseUrls : [],
  encryptionConfigured: !!settings.encryptionConfigured,
  mockEnabled: !!settings.mockProviderEnabled,
  defaultProviderId,
  arenaDefaultReady: providers.some((entry) => entry.kind === 'arenaDefault' && entry.status === 'ready'),
})

/**
 * Returns the local provider list without the removed provider, and whether the default must go back to Arena
 * default (the server cannot see local providers, so the browser resets it).
 * @param {object} params - Parameters.
 * @param {LocalProvider[]} params.providers - Stored local providers.
 * @param {string} params.id - Removed provider id.
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {{providers: LocalProvider[], resetDefault: boolean}} The new list and the reset flag.
 */
export const buildLocalProviderRemoval = ({
  providers,
  id,
  defaultProviderId,
}: {
  providers: LocalProvider[]
  id: string
  defaultProviderId: string
}): { providers: LocalProvider[]; resetDefault: boolean } => ({
  providers: providers.filter((provider) => provider.id !== id),
  resetDefault: id === defaultProviderId,
})
