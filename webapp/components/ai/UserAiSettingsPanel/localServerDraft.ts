/**
 * Local AI server block of the AI settings panel: the draft edited in the panel and written by the profile Save. Pure.
 */
import { normalizeLocalServerSettings, saveLocalServerSettings } from '@webapp/ai/engines/localServerSettings'
import { getLocalServerTestView, type LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerCapability, AiLocalServerSettings, StorageLike } from '@webapp/ai/engines/types'

// the result of this session's Test, for the (normalized) URL it tested
export type LocalSessionTest = { baseUrl: string; view: LocalServerTestView }

/**
 * Returns the URL as it is stored (trimmed, no trailing slash, the default URL when empty).
 * @param {string} baseUrl - Typed URL.
 * @returns {string} The normalized URL.
 */
export const normalizeLocalBaseUrl = (baseUrl: string): string => normalizeLocalServerSettings({ baseUrl }).baseUrl

/**
 * Returns true when the draft differs from the saved settings once both are normalized.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.draft - Draft.
 * @param {AiLocalServerSettings} params.saved - Saved settings.
 * @returns {boolean} True when Save has something to write.
 */
export const isLocalDraftChanged = ({
  draft,
  saved,
}: {
  draft: AiLocalServerSettings
  saved: AiLocalServerSettings
}): boolean => {
  const next = normalizeLocalServerSettings(draft)
  const current = normalizeLocalServerSettings(saved)
  return (
    next.enabled !== current.enabled ||
    next.baseUrl !== current.baseUrl ||
    next.modelId !== current.modelId ||
    next.preferLocal !== current.preferLocal
  )
}

/**
 * Normalizes the typed URL (on blur); a model of another server is dropped.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.draft - Draft.
 * @param {string} params.committedBaseUrl - URL the chosen model belongs to.
 * @returns {AiLocalServerSettings} The new draft (the same object when nothing changes).
 */
export const commitLocalBaseUrl = ({
  draft,
  committedBaseUrl,
}: {
  draft: AiLocalServerSettings
  committedBaseUrl: string
}): AiLocalServerSettings => {
  const baseUrl = normalizeLocalBaseUrl(draft.baseUrl)
  const modelId = baseUrl === normalizeLocalBaseUrl(committedBaseUrl) ? draft.modelId : null
  if (baseUrl === draft.baseUrl && modelId === draft.modelId) return draft
  return { ...draft, baseUrl, modelId }
}

/**
 * Returns the model to choose after a Test.
 * @param {object} params - Parameters.
 * @param {boolean} params.reachable - The server answered.
 * @param {string[]} params.models - Models it lists.
 * @param {string|null} params.modelId - Chosen model.
 * @returns {string|null} The chosen model when listed, else the first listed one; unchanged when unreachable.
 */
export const pickProbedModel = ({
  reachable,
  models,
  modelId,
}: {
  reachable: boolean
  models: string[]
  modelId: string | null
}): string | null => {
  if (!reachable) return modelId
  if (modelId && models.includes(modelId)) return modelId
  return models[0] ?? null
}

/**
 * Returns the options of the Model select.
 * @param {object} params - Parameters.
 * @param {LocalServerTestView|null} params.testView - Result shown.
 * @param {string|null} params.modelId - Chosen model.
 * @returns {string[]} The listed models, with the chosen one first when it is not listed.
 */
export const listLocalModels = ({
  testView,
  modelId,
}: {
  testView: LocalServerTestView | null
  modelId: string | null
}): string[] => {
  const listed = testView?.models ?? []
  return modelId && !listed.includes(modelId) ? [modelId, ...listed] : listed
}

/**
 * Returns true when a Test result still applies: same user, same server URL.
 * @param {object} params - Parameters.
 * @param {string|null} params.testedUserUuid - User when the Test started.
 * @param {string|null} params.currentUserUuid - User now.
 * @param {string} params.testedBaseUrl - Tested URL.
 * @param {string} params.currentBaseUrl - URL in the draft now.
 * @returns {boolean} True when the result may be shown and used.
 */
export const acceptLocalTestResult = ({
  testedUserUuid,
  currentUserUuid,
  testedBaseUrl,
  currentBaseUrl,
}: {
  testedUserUuid: string | null
  currentUserUuid: string | null
  testedBaseUrl: string
  currentBaseUrl: string
}): boolean =>
  testedUserUuid !== null &&
  testedUserUuid === currentUserUuid &&
  normalizeLocalBaseUrl(testedBaseUrl) === normalizeLocalBaseUrl(currentBaseUrl)

/**
 * Returns the result to show for the draft URL: this session's Test, else the app's last probe of the same URL.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.draft - Draft.
 * @param {LocalSessionTest|null} params.sessionTest - This session's last accepted Test.
 * @param {AiLocalServerCapability} params.capability - Local server capability (probe of the saved settings).
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {string} params.pageProtocol - Protocol of the Arena page.
 * @returns {LocalServerTestView|null} The result, or null when the URL was not tested.
 */
export const getCurrentLocalTestView = ({
  draft,
  sessionTest,
  capability,
  allowlist,
  pageProtocol,
}: {
  draft: AiLocalServerSettings
  sessionTest: LocalSessionTest | null
  capability: AiLocalServerCapability
  allowlist: string[]
  pageProtocol: string
}): LocalServerTestView | null => {
  const baseUrl = normalizeLocalBaseUrl(draft.baseUrl)
  if (sessionTest?.baseUrl === baseUrl) return sessionTest.view
  // a saved, working server shows its result on page load, without a Test
  if (!capability.enabled || capability.reachable === null || capability.baseUrl !== baseUrl) return null
  const { reachable, models, contextTokens, error } = capability
  return getLocalServerTestView({
    probe: { reachable, models, contextTokens, error },
    baseUrl,
    allowlist,
    pageProtocol,
  })
}

/**
 * Writes the draft to the browser storage when it changed.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Browser storage.
 * @param {string|null} params.userUuid - Logged-in user.
 * @param {AiLocalServerSettings} params.draft - Draft.
 * @param {AiLocalServerSettings} params.saved - Saved settings.
 * @returns {{ok: boolean, saved: AiLocalServerSettings}} ok false when the storage refused it (saved unchanged).
 */
export const saveLocalDraft = ({
  storage,
  userUuid,
  draft,
  saved,
}: {
  storage: StorageLike | null
  userUuid: string | null
  draft: AiLocalServerSettings
  saved: AiLocalServerSettings
}): { ok: boolean; saved: AiLocalServerSettings } => {
  if (!isLocalDraftChanged({ draft, saved })) return { ok: true, saved }
  const next = normalizeLocalServerSettings(draft)
  return saveLocalServerSettings({ storage, userUuid, settings: next })
    ? { ok: true, saved: next }
    : { ok: false, saved }
}

/**
 * Runs the profile Save of the panel: account settings (PUT), then local settings, then one capabilities refresh.
 * @param {object} params - Parameters.
 * @param {Function|null} params.saveServer - PUT of the account settings, null when they did not change.
 * @param {Function} params.saveLocal - Writes the local draft; false when the storage refused it.
 * @param {Function} params.refresh - Reloads the capabilities.
 * @returns {Promise<{server: *, localSaved: boolean}>} The PUT result and whether the local settings were written.
 */
export const saveAiPanelSettings = async <T>({
  saveServer,
  saveLocal,
  refresh,
}: {
  saveServer: (() => Promise<T>) | null
  saveLocal: () => boolean
  refresh: () => Promise<unknown>
}): Promise<{ server: T | null; localSaved: boolean }> => {
  // a failed PUT throws here: nothing is written locally and nothing is refreshed
  const server = saveServer ? await saveServer() : null
  const localSaved = saveLocal()
  // the gateway, the local server and their hosting classes may have changed
  refresh().catch(() => undefined)
  return { server, localSaved }
}
