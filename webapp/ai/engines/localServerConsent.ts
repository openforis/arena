/**
 * First-use consent for the local AI server, per user, survey and server URL (localStorage).
 */
import type { AiConsentDecision, AiLocalServerSettings, StorageLike } from './types'

type ConsentEntry = { decision: AiConsentDecision; baseUrl: string }
type ConsentMap = Record<string, ConsentEntry>

const DECISIONS: AiConsentDecision[] = ['accepted', 'declined']

/**
 * Returns the localStorage key of the user's consent decisions.
 * @param {string} userUuid - User UUID.
 * @returns {string} The key.
 */
export const getLocalServerConsentKey = (userUuid: string): string => `arena.ai.localServerConsent.${userUuid}`

/**
 * Returns the key of the survey inside the consent map ('none' when there is no survey).
 * @param {number|null} [surveyId] - Survey id.
 * @returns {string} The key.
 */
const surveyKey = (surveyId?: number | null): string => (surveyId ? String(surveyId) : 'none')

/**
 * Reads the consent map of the user; unavailable storage or corrupt JSON give an empty map.
 * @param {StorageLike} storage - Storage.
 * @param {string} userUuid - User UUID.
 * @returns {ConsentMap} The map.
 */
const readMap = (storage: StorageLike, userUuid: string): ConsentMap => {
  try {
    const parsed = JSON.parse(storage.getItem(getLocalServerConsentKey(userUuid)) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Returns the stored decision for the survey, or null when the user must be asked (none, or another URL).
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {string} params.baseUrl - Current server URL.
 * @returns {AiConsentDecision|null} The decision.
 */
export const loadLocalServerConsent = ({
  storage,
  userUuid,
  surveyId,
  baseUrl,
}: {
  storage: StorageLike | null
  userUuid: string | null
  surveyId?: number | null
  baseUrl: string
}): AiConsentDecision | null => {
  if (!storage || !userUuid) return null
  const entry = readMap(storage, userUuid)[surveyKey(surveyId)]
  const valid = !!entry && DECISIONS.includes(entry.decision) && entry.baseUrl === baseUrl
  return valid ? entry.decision : null
}

/**
 * Stores the decision for the survey and server URL.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {string} params.baseUrl - Server URL shown in the card.
 * @param {AiConsentDecision} params.decision - The decision.
 * @returns {boolean} False when the storage is unavailable or full.
 */
export const saveLocalServerConsent = ({
  storage,
  userUuid,
  surveyId,
  baseUrl,
  decision,
}: {
  storage: StorageLike | null
  userUuid: string | null
  surveyId?: number | null
  baseUrl: string
  decision: AiConsentDecision
}): boolean => {
  if (!storage || !userUuid) return false
  try {
    const map = { ...readMap(storage, userUuid), [surveyKey(surveyId)]: { decision, baseUrl } }
    storage.setItem(getLocalServerConsentKey(userUuid), JSON.stringify(map))
    return true
  } catch {
    return false
  }
}

/**
 * Returns whether the local server comes first for this survey: the user's preference, unless they declined it here.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.settings - Local server settings.
 * @param {AiConsentDecision|null} params.consent - Stored decision for the survey.
 * @returns {boolean} True when local comes first.
 */
export const getEffectivePreferLocal = ({
  settings,
  consent,
}: {
  settings: AiLocalServerSettings
  consent: AiConsentDecision | null
}): boolean => settings.preferLocal && consent !== 'declined'
