/**
 * Status line of "Where AI runs": the engine that would answer a schema request now (default survey policy). Pure.
 */
import { getLocalServerHostingClass, isOrgHostedUrl } from '@common/ai/localServerAddress'

import { LOCAL_SERVER_LABEL } from '@webapp/ai/engines/engineInfo'
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerSettings } from '@webapp/ai/engines/types'
import { type AiDataLocation, getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'

import { type AdminDefault, type ProviderSpec, shouldShowLocalUrlHint, type TFunction } from './aiSettingsForm'
import { normalizeLocalBaseUrl } from './localServerDraft'

export type AiEnginePill = 'ready' | 'notTested' | 'notAvailable'

export type AiEngineCandidate = { id: 'localServer' | 'cloud'; location: AiDataLocation; pill: AiEnginePill }

export type AiEngineStatus = { engine: AiEngineCandidate | null; pill: AiEnginePill }

// the cloud part of the form, with whether the server has a key to use
export type CloudDraft = { provider: string; model: string; baseUrl: string; hasApiKey: boolean }

/**
 * Returns the pill of the local server.
 * @param {object} params - Parameters.
 * @param {LocalServerTestView|null} params.testView - Result for the draft URL.
 * @param {string|null} params.modelId - Chosen model.
 * @returns {AiEnginePill} Ready only when the server answered and lists the chosen model.
 */
const getLocalPill = ({
  testView,
  modelId,
}: {
  testView: LocalServerTestView | null
  modelId: string | null
}): AiEnginePill => {
  if (!testView) return 'notTested'
  if (!testView.reachable) return 'notAvailable'
  return modelId && testView.models.includes(modelId) ? 'ready' : 'notAvailable'
}

/**
 * Returns the local server candidate.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.draft - Local draft.
 * @param {LocalServerTestView|null} params.testView - Result for the draft URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {AiEngineCandidate|null} The candidate, null when Use is off.
 */
export const getLocalEngineCandidate = ({
  draft,
  testView,
  allowlist,
}: {
  draft: AiLocalServerSettings
  testView: LocalServerTestView | null
  allowlist: string[]
}): AiEngineCandidate | null => {
  if (!draft.enabled) return null
  const hostingClass = getLocalServerHostingClass(normalizeLocalBaseUrl(draft.baseUrl), allowlist)
  return {
    id: 'localServer',
    location: {
      hostingClass,
      provider: null,
      model: draft.modelId,
      engine: hostingClass === 'onDevice' ? LOCAL_SERVER_LABEL : null,
    },
    pill: getLocalPill({ testView, modelId: draft.modelId }),
  }
}

/**
 * Returns true when the draft has everything its provider needs.
 * @param {object} params - Parameters.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @param {CloudDraft} params.draft - Cloud draft.
 * @returns {boolean} True when complete.
 */
const isCloudDraftComplete = ({ spec, draft }: { spec: ProviderSpec; draft: CloudDraft }): boolean =>
  (!spec.requiresBaseUrl || !!draft.baseUrl.trim()) &&
  (!spec.requiresApiKey || draft.hasApiKey) &&
  (!spec.supportsModelList || !!draft.model.trim())

/**
 * Returns the pill of a personal provider.
 * @param {object} params - Parameters.
 * @param {boolean} params.localUrl - The Base URL is local (the server refuses it).
 * @param {boolean|null} params.testOk - This session's Test of the current draft, null when none.
 * @param {{matches: boolean, lastTestOk: boolean|null}} params.saved - Draft equals the saved provider; its stored Test.
 * @returns {AiEnginePill} The pill.
 */
const getCloudPill = ({
  localUrl,
  testOk,
  saved,
}: {
  localUrl: boolean
  testOk: boolean | null
  saved: { matches: boolean; lastTestOk: boolean | null }
}): AiEnginePill => {
  if (localUrl) return 'notAvailable'
  if (testOk !== null) return testOk ? 'ready' : 'notAvailable'
  if (!saved.matches) return 'notTested'
  return saved.lastTestOk === false ? 'notAvailable' : 'ready'
}

/**
 * Returns the cloud candidate: the Arena default or the personal provider of the draft.
 * @param {object} params - Parameters.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @param {CloudDraft} params.draft - Cloud draft.
 * @param {AdminDefault|null} params.adminDefault - Instance default provider.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {{matches: boolean, lastTestOk: boolean|null}} params.saved - Draft equals the saved provider; its stored Test.
 * @param {boolean|null} params.testOk - This session's Test of the current draft, null when none.
 * @returns {AiEngineCandidate|null} The candidate, null when there is none or the draft is incomplete.
 */
export const getCloudEngineCandidate = ({
  spec,
  draft,
  adminDefault,
  allowlist,
  saved,
  testOk,
}: {
  spec: ProviderSpec
  draft: CloudDraft
  adminDefault: AdminDefault | null
  allowlist: string[]
  saved: { matches: boolean; lastTestOk: boolean | null }
  testOk: boolean | null
}): AiEngineCandidate | null => {
  if (spec.isDefault) {
    if (!adminDefault) return null
    const { hostingClass, provider, model } = adminDefault
    return { id: 'cloud', location: { hostingClass, provider, model, engine: null }, pill: 'ready' }
  }
  if (!isCloudDraftComplete({ spec, draft })) return null
  const orgHosted = spec.requiresBaseUrl && isOrgHostedUrl(draft.baseUrl, allowlist)
  const localUrl = shouldShowLocalUrlHint({ spec, baseUrl: draft.baseUrl, allowlist })
  return {
    id: 'cloud',
    location: {
      hostingClass: orgHosted ? 'orgHosted' : 'cloud',
      provider: draft.provider,
      model: spec.supportsModelList ? draft.model : null,
      engine: null,
    },
    pill: getCloudPill({ localUrl, testOk, saved }),
  }
}

/**
 * Returns the engine of the status line, in the order of the Order radio.
 * @param {object} params - Parameters.
 * @param {boolean} params.preferLocal - Local server first.
 * @param {AiEngineCandidate|null} params.local - Local server candidate.
 * @param {AiEngineCandidate|null} params.cloud - Cloud candidate.
 * @returns {AiEngineStatus} The first engine that is not "Not available", else the first configured one.
 */
export const getAiEngineStatus = ({
  preferLocal,
  local,
  cloud,
}: {
  preferLocal: boolean
  local: AiEngineCandidate | null
  cloud: AiEngineCandidate | null
}): AiEngineStatus => {
  const ordered = (preferLocal ? [local, cloud] : [cloud, local]).filter(
    (candidate): candidate is AiEngineCandidate => candidate !== null
  )
  const engine = ordered.find((candidate) => candidate.pill !== 'notAvailable') ?? ordered[0] ?? null
  return { engine, pill: engine?.pill ?? 'notAvailable' }
}

/**
 * Returns the text of the status line.
 * @param {object} params - Parameters.
 * @param {AiEngineStatus} params.status - Status.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The data location and the model, or what to do when no engine is configured.
 */
export const getAiEngineStatusText = ({ status, t }: { status: AiEngineStatus; t: TFunction }): string => {
  if (!status.engine) return t('userAiSettings:status.none')
  const { location } = status.engine
  return [getAiDataLocationText({ location, t }), location.model].filter(Boolean).join(' · ')
}
