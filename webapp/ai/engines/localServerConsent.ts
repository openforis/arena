/**
 * First-use consent for the local AI server, per user, survey, server URL and data class (localStorage).
 * A consent for record data covers the survey design too, never the other way round.
 */
import { type AiDataClass, getAiDataClassLevel, isAiDataClass } from '@common/ai/features'

import type { AiConsentDecision, StorageLike } from './types'

// dataClass: the highest class the user accepted; absent in entries stored before the class existed
type ConsentEntry = { decision: AiConsentDecision; baseUrl: string; dataClass?: AiDataClass }
type ConsentMap = Record<string, ConsentEntry>

// the class of a request that names none, and of a stored entry that names none or an unknown one
const DEFAULT_DATA_CLASS: AiDataClass = 'schema'

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
 * Returns the data class of a stored entry (the survey design when it names none or an unknown one: an older entry
 * never covered record data, so the user is asked again for it).
 * @param {ConsentEntry} entry - The stored entry.
 * @returns {AiDataClass} The class.
 */
const getEntryDataClass = (entry: ConsentEntry): AiDataClass =>
  isAiDataClass(entry.dataClass) ? entry.dataClass : DEFAULT_DATA_CLASS

/**
 * Returns whether the stored entry is a valid one for this server URL.
 * @param {ConsentEntry|undefined} entry - The stored entry.
 * @param {string} baseUrl - Server URL.
 * @returns {boolean} True for a well-formed entry of that URL.
 */
const isEntryOf = (entry: ConsentEntry | undefined, baseUrl: string): entry is ConsentEntry =>
  !!entry && DECISIONS.includes(entry.decision) && entry.baseUrl === baseUrl

/**
 * Returns the stored decision for the survey, or null when the user must be asked (none, another URL, or an
 * accepted consent that does not reach the requested data class).
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {string} params.baseUrl - Current server URL.
 * @param {AiDataClass} [params.dataClass] - Data class the request sends (the survey design when absent).
 * @returns {AiConsentDecision|null} The decision.
 */
export const loadLocalServerConsent = ({
  storage,
  userUuid,
  surveyId,
  baseUrl,
  dataClass = DEFAULT_DATA_CLASS,
}: {
  storage: StorageLike | null
  userUuid: string | null
  surveyId?: number | null
  baseUrl: string
  dataClass?: AiDataClass
}): AiConsentDecision | null => {
  if (!storage || !userUuid) return null
  const entry = readMap(storage, userUuid)[surveyKey(surveyId)]
  if (!isEntryOf(entry, baseUrl)) return null
  if (entry.decision === 'accepted' && getAiDataClassLevel(getEntryDataClass(entry)) < getAiDataClassLevel(dataClass)) {
    return null
  }
  return entry.decision
}

/**
 * Returns the class to store: the highest of the new one and the accepted one already stored for the same server
 * (a consent for the survey design never lowers a consent for record data).
 * @param {ConsentEntry|undefined} previous - The stored entry of the survey.
 * @param {object} params - What is being saved.
 * @param {string} params.baseUrl - Server URL.
 * @param {AiConsentDecision} params.decision - The decision.
 * @param {AiDataClass} params.dataClass - The new class.
 * @returns {AiDataClass} The class.
 */
const getClassToStore = (
  previous: ConsentEntry | undefined,
  { baseUrl, decision, dataClass }: { baseUrl: string; decision: AiConsentDecision; dataClass: AiDataClass }
): AiDataClass => {
  if (decision !== 'accepted' || !isEntryOf(previous, baseUrl) || previous.decision !== 'accepted') return dataClass
  const stored = getEntryDataClass(previous)
  return getAiDataClassLevel(stored) > getAiDataClassLevel(dataClass) ? stored : dataClass
}

/**
 * Stores the decision for the survey, server URL and data class.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {string} params.baseUrl - Server URL shown in the card.
 * @param {AiConsentDecision} params.decision - The decision.
 * @param {AiDataClass} [params.dataClass] - Data class the user was asked about (the survey design when absent).
 * @returns {boolean} False when the storage is unavailable or full.
 */
export const saveLocalServerConsent = ({
  storage,
  userUuid,
  surveyId,
  baseUrl,
  decision,
  dataClass = DEFAULT_DATA_CLASS,
}: {
  storage: StorageLike | null
  userUuid: string | null
  surveyId?: number | null
  baseUrl: string
  decision: AiConsentDecision
  dataClass?: AiDataClass
}): boolean => {
  if (!storage || !userUuid) return false
  try {
    const current = readMap(storage, userUuid)
    const key = surveyKey(surveyId)
    const entry: ConsentEntry = {
      decision,
      baseUrl,
      dataClass: getClassToStore(current[key], { baseUrl, decision, dataClass }),
    }
    storage.setItem(getLocalServerConsentKey(userUuid), JSON.stringify({ ...current, [key]: entry }))
    return true
  } catch {
    return false
  }
}

/**
 * Returns whether the user has an accepted consent, for any survey and data class, for the server URL.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {string} params.baseUrl - Server URL.
 * @returns {boolean} True when there is one to revoke.
 */
export const hasLocalServerConsent = ({
  storage,
  userUuid,
  baseUrl,
}: {
  storage: StorageLike | null
  userUuid: string | null
  baseUrl: string
}): boolean => {
  if (!storage || !userUuid) return false
  return Object.values(readMap(storage, userUuid)).some(
    (entry) => isEntryOf(entry, baseUrl) && entry.decision === 'accepted'
  )
}

/**
 * Removes the user's consent for the server URL, for every survey and data class: the next local request asks again.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {string} params.baseUrl - Server URL.
 * @returns {boolean} False when the storage is unavailable or could not be written.
 */
export const revokeLocalServerConsent = ({
  storage,
  userUuid,
  baseUrl,
}: {
  storage: StorageLike | null
  userUuid: string | null
  baseUrl: string
}): boolean => {
  if (!storage || !userUuid) return false
  try {
    const kept = Object.entries(readMap(storage, userUuid)).filter(([, entry]) => entry?.baseUrl !== baseUrl)
    storage.setItem(getLocalServerConsentKey(userUuid), JSON.stringify(Object.fromEntries(kept)))
    return true
  } catch {
    return false
  }
}
