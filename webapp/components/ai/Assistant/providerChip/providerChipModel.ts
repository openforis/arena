/**
 * Provider chip of the assistant composer (spec section 5): the conversation's provider, the rows of the
 * "Answer with" popover and the chip text. Pure.
 */
import type { AiDataClass } from '@common/ai/features'
import { type AiPolicy, isHostingAllowed } from '@common/ai/policy'

import { getEffectiveProviderId } from '@webapp/ai/engines/selectEngine'
import type { AiCapabilities, AiProviderEntry } from '@webapp/ai/engines/types'
import { type AiFeatureAvailabilityStatus, getPolicyBlockedReasonKeys } from '@webapp/ai/policy/aiFeatureAvailability'
import type { TFunction } from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'
import {
  getProviderDisplayName,
  getProviderStatusPill,
  getProviderWhereKey,
  type ProviderWhereKey,
} from '@webapp/components/ai/UserAiSettingsPanel/providerList'

export type ConversationProvider = {
  // the provider that answers (the conversation's, else the default)
  providerId: string
  // null: the default is a local provider saved on another computer
  entry: AiProviderEntry | null
  // the conversation named a provider that is no longer in the list
  removed: boolean
}

export type ProviderChoice = {
  entry: AiProviderEntry
  selected: boolean
  isDefault: boolean
  disabled: boolean
  // why the row is disabled (i18n key), null when it can be picked or while the policy loads
  reasonKey: string | null
  whereKey: ProviderWhereKey | null
}

export type ProviderChipView =
  { kind: 'none' } | { kind: 'missing' } | { kind: 'provider'; entry: AiProviderEntry; tone: 'ok' | 'bad' }

/**
 * Returns the provider that answers in a conversation.
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities (provider list and default).
 * @param {string|null} [params.providerId] - Provider stored with the conversation.
 * @returns {ConversationProvider} The provider.
 */
export const getConversationProvider = ({
  capabilities,
  providerId,
}: {
  capabilities: AiCapabilities
  providerId?: string | null
}): ConversationProvider => {
  const effectiveId = getEffectiveProviderId({ capabilities, providerId })
  return {
    providerId: effectiveId,
    entry: capabilities.providers.find((entry) => entry.id === effectiveId) ?? null,
    removed: Boolean(providerId) && providerId !== effectiveId,
  }
}

/**
 * Returns true when the chip can open the "Answer with" popover (at least one provider is set up).
 * @param {AiCapabilities} capabilities - Capabilities.
 * @returns {boolean} True when the switcher can be opened.
 */
export const canOpenProviderChooser = (capabilities: AiCapabilities): boolean =>
  capabilities.providers.some((entry) => entry.status !== 'notSetUp')

/**
 * Returns true when the "provider was removed" notice applies: only once the user's providers are loaded.
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities (provider list and default).
 * @param {boolean} params.loaded - The capabilities are loaded for this user.
 * @param {string|null} [params.providerId] - Provider stored with the conversation.
 * @returns {boolean} True to show the notice.
 */
export const shouldShowProviderRemoved = ({
  capabilities,
  loaded,
  providerId,
}: {
  capabilities: AiCapabilities
  loaded: boolean
  providerId?: string | null
}): boolean => loaded && getConversationProvider({ capabilities, providerId }).removed

/**
 * Returns why a row cannot be picked: the policy first, then an Arena default without an admin default.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - Provider.
 * @param {AiPolicy} params.effective - Effective policy of the conversation.
 * @param {AiDataClass} params.dataClass - Data class of the conversation.
 * @param {boolean} params.surveyScoped - The conversation belongs to a survey.
 * @returns {string|null} The i18n key, or null.
 */
const getChoiceBlockKey = ({
  entry,
  effective,
  dataClass,
  surveyScoped,
}: {
  entry: AiProviderEntry
  effective: AiPolicy
  dataClass: AiDataClass
  surveyScoped: boolean
}): string | null => {
  const allowed = effective[dataClass]
  const blocked =
    allowed === 'off' ||
    (entry.hostingClass !== null && !isHostingAllowed({ effective, dataClass, hostingClass: entry.hostingClass }))
  // the same text as the not-available message ("This survey's AI policy keeps record data on this device.")
  if (blocked) return getPolicyBlockedReasonKeys({ dataClass, allowed, surveyScoped })[0]
  return entry.status === 'notSetUp' ? getProviderStatusPill('notSetUp').key : null
}

/**
 * Returns the rows of the "Answer with" popover, in the list order (Arena default last).
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities (only this browser's local providers are listed).
 * @param {AiPolicy|null} params.effective - Effective policy (null while loading: every row is disabled).
 * @param {AiDataClass} params.dataClass - Data class of the conversation.
 * @param {boolean} params.surveyScoped - The conversation belongs to a survey.
 * @param {string} params.selectedId - Provider that answers now.
 * @returns {ProviderChoice[]} The rows.
 */
export const buildProviderChoices = ({
  capabilities,
  effective,
  dataClass,
  surveyScoped,
  selectedId,
}: {
  capabilities: AiCapabilities
  effective: AiPolicy | null
  dataClass: AiDataClass
  surveyScoped: boolean
  selectedId: string
}): ProviderChoice[] =>
  capabilities.providers.map((entry) => {
    const reasonKey = effective ? getChoiceBlockKey({ entry, effective, dataClass, surveyScoped }) : null
    return {
      entry,
      selected: entry.id === selectedId,
      isDefault: entry.id === capabilities.defaultProviderId,
      disabled: !effective || reasonKey !== null,
      reasonKey,
      whereKey: getProviderWhereKey(entry),
    }
  })

/**
 * Returns true when at least one row of the "Answer with" popover can be picked under the policy.
 * @param {object} params - Parameters (those of buildProviderChoices, without the selected provider).
 * @param {AiCapabilities} params.capabilities - Capabilities.
 * @param {AiPolicy|null} params.effective - Effective policy (null while loading: nothing can be picked).
 * @param {AiDataClass} params.dataClass - Data class of the conversation.
 * @param {boolean} params.surveyScoped - The conversation belongs to a survey.
 * @returns {boolean} True when the user can switch to a usable provider.
 */
export const hasPickableProvider = ({
  capabilities,
  effective,
  dataClass,
  surveyScoped,
}: {
  capabilities: AiCapabilities
  effective: AiPolicy | null
  dataClass: AiDataClass
  surveyScoped: boolean
}): boolean =>
  buildProviderChoices({
    capabilities,
    effective,
    dataClass,
    surveyScoped,
    selectedId: capabilities.defaultProviderId,
  }).some((choice) => !choice.disabled)

/**
 * Returns what the chip shows.
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities.
 * @param {ConversationProvider} params.current - Provider of the conversation.
 * @param {AiFeatureAvailabilityStatus} params.status - Availability of the area's feature with that provider.
 * @returns {ProviderChipView} The view.
 */
export const getProviderChipView = ({
  capabilities,
  current,
  status,
}: {
  capabilities: AiCapabilities
  current: ConversationProvider
  status: AiFeatureAvailabilityStatus
}): ProviderChipView => {
  // only Arena default, without an admin default: nothing can answer until the user adds a provider
  if (!canOpenProviderChooser(capabilities)) return { kind: 'none' }
  if (!current.entry) return { kind: 'missing' }
  return { kind: 'provider', entry: current.entry, tone: status === 'available' ? 'ok' : 'bad' }
}

/**
 * Returns the chip text: the provider name, then the model.
 * @param {object} params - Parameters.
 * @param {AiProviderEntry} params.entry - Provider.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The text.
 */
export const getProviderChipLabel = ({ entry, t }: { entry: AiProviderEntry; t: TFunction }): string => {
  const name = getProviderDisplayName({ entry, t })
  return entry.model ? `${name} · ${entry.model}` : name
}
