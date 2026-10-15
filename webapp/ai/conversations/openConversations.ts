/**
 * The conversation open in each assistant area, per user and survey, remembered in localStorage: it survives area
 * switches, reloads and logout. When the storage is blocked or full, the values live in memory for the session.
 * Stored as `{ "<surveyId|help>": { "<area>": "<conversationId>" } }` under `arena.ai.openConversations.<userUuid>`.
 */
import {
  createResilientStorage,
  getBrowserLocalStorage,
  type ResilientStorageBackend,
} from '@webapp/ai/storage/resilientStorage'

export type OpenConversationsStorage = ResilientStorageBackend

export type OpenConversationKey = { userUuid: string; surveyId: number | null; area: string }

export type OpenConversations = {
  get: (key: OpenConversationKey) => string | null
  // null removes the area's entry
  set: (params: OpenConversationKey & { conversationId: string | null }) => void
  clear: (userUuid: string) => void
  // forgets the survey's entries of every user of this browser (the survey was deleted)
  clearSurvey: (surveyId: number) => void
}

type OpenConversationsMap = Record<string, Record<string, string>>

const KEY_PREFIX = 'arena.ai.openConversations.'
// no survey open: only Help is available
const NO_SURVEY_ENTRY = 'help'

/**
 * Returns the localStorage key of a user's open conversations.
 * @param {string} userUuid - User UUID.
 * @returns {string} The key.
 */
export const getOpenConversationsKey = (userUuid: string): string => `${KEY_PREFIX}${userUuid}`

/**
 * Returns the entry of a survey in the stored map.
 * @param {number|null} surveyId - Survey id (null: no survey open).
 * @returns {string} The entry key.
 */
const toSurveyEntry = (surveyId: number | null): string => (surveyId === null ? NO_SURVEY_ENTRY : String(surveyId))

/**
 * Returns true for a non-array object.
 * @param {unknown} value - Value.
 * @returns {boolean} True for a plain object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Keeps the area entries whose value is a non-empty id.
 * @param {Record<string, unknown>} areas - Raw area entries.
 * @returns {Record<string, string>} The valid entries.
 */
const validAreas = (areas: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(areas).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')
  )

/**
 * Parses a stored value; anything unexpected is dropped (a corrupt value means no open conversation).
 * @param {string|null} raw - Stored JSON.
 * @returns {OpenConversationsMap} The open conversation ids by survey entry and area.
 */
export const parseOpenConversations = (raw: string | null): OpenConversationsMap => {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!isPlainObject(parsed)) return {}
  const result: OpenConversationsMap = {}
  for (const [surveyEntry, areas] of Object.entries(parsed)) {
    const valid = isPlainObject(areas) ? validAreas(areas) : {}
    if (Object.keys(valid).length > 0) result[surveyEntry] = valid
  }
  return result
}

/**
 * Returns a copy of a record without one key.
 * @param {Record<string, T>} record - Record.
 * @param {string} key - Key to leave out.
 * @returns {Record<string, T>} The copy.
 */
const without = <T>(record: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([entryKey]) => entryKey !== key))

/**
 * Returns the map with one area entry set or removed (an emptied survey entry is removed too).
 * @param {OpenConversationsMap} map - Current map.
 * @param {object} params - Parameters.
 * @param {string} params.surveyEntry - Survey entry.
 * @param {string} params.area - Area.
 * @param {string|null} params.conversationId - Id, or null to remove.
 * @returns {OpenConversationsMap} The new map.
 */
const withEntry = (
  map: OpenConversationsMap,
  { surveyEntry, area, conversationId }: { surveyEntry: string; area: string; conversationId: string | null }
): OpenConversationsMap => {
  const current = map[surveyEntry] ?? {}
  const areas = conversationId ? { ...current, [area]: conversationId } : without(current, area)
  return Object.keys(areas).length > 0 ? { ...map, [surveyEntry]: areas } : without(map, surveyEntry)
}

/**
 * Creates the open conversations store.
 * @param {object} params - Parameters.
 * @param {Function} params.getStorage - Returns the storage, or null when there is none (may throw when blocked).
 * @param {Function} [params.log] - Reports what the storage wrapper recovered from.
 * @returns {OpenConversations} The store.
 */
export const createOpenConversations = ({
  getStorage,
  log,
}: {
  getStorage: () => OpenConversationsStorage | null
  log?: (message: string, error?: unknown) => void
}): OpenConversations => {
  const storage = createResilientStorage({ getStorage, log })

  /**
   * Writes the map of a user; an emptied map removes the key.
   * @param {string} key - Storage key.
   * @param {OpenConversationsMap} map - New map.
   * @returns {void}
   */
  const writeMap = (key: string, map: OpenConversationsMap): void => {
    if (Object.keys(map).length === 0) storage.remove(key)
    else storage.write(key, JSON.stringify(map))
  }

  return {
    get: ({ userUuid, surveyId, area }) =>
      parseOpenConversations(storage.read(getOpenConversationsKey(userUuid)))[toSurveyEntry(surveyId)]?.[area] ?? null,
    set: ({ userUuid, surveyId, area, conversationId }) => {
      const key = getOpenConversationsKey(userUuid)
      const next = withEntry(parseOpenConversations(storage.read(key)), {
        surveyEntry: toSurveyEntry(surveyId),
        area,
        conversationId,
      })
      storage.write(key, JSON.stringify(next))
    },
    clear: (userUuid) => storage.remove(getOpenConversationsKey(userUuid)),
    clearSurvey: (surveyId) => {
      const surveyEntry = toSurveyEntry(surveyId)
      for (const key of storage.keys(KEY_PREFIX)) {
        const map = parseOpenConversations(storage.read(key))
        if (map[surveyEntry]) writeMap(key, without(map, surveyEntry))
      }
    },
  }
}

export const browserOpenConversations: OpenConversations = createOpenConversations({
  getStorage: getBrowserLocalStorage,
})

/**
 * Returns the open conversation of an area (browser storage).
 * @param {OpenConversationKey} key - User, survey and area.
 * @returns {string|null} The conversation id.
 */
export const getOpenConversationId = (key: OpenConversationKey): string | null => browserOpenConversations.get(key)

/**
 * Remembers (or forgets, with null) the open conversation of an area (browser storage).
 * @param {object} params - User, survey, area and conversation id.
 * @returns {void}
 */
export const setOpenConversationId = (params: OpenConversationKey & { conversationId: string | null }): void =>
  browserOpenConversations.set(params)
