/**
 * The suggestions of each user, in localStorage under `arena.ai.suggestions.<userUuid>`. Every mutation re-reads the
 * key, applies the change and writes it back in one synchronous step; the `storage` event of the other tabs notifies
 * the subscribers. When the storage is blocked or full, the values live in memory for the session.
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import {
  getInProgressConversationIds,
  getPendingOf,
  parseSuggestionState,
  selectVisible,
  toBucket,
  withAdded,
  withDismissed,
  withKind,
  withModuleSeen,
  withoutSuggestion,
  withoutTargets,
  withProgress,
  withSettled,
  type SuggestionUserState,
} from './suggestionState'
import type { AssistantSuggestion, SettleOutcome, SuggestionKind } from './types'

export type SuggestionStorageAccess = {
  getStorage: () => Storage | null // null: blocked → memory fallback
  addStorageListener: (listener: (key: string | null) => void) => () => void // the window 'storage' event
}

export type SuggestionStore = {
  setKind: (p: {
    userUuid: string
    surveyId: number | null
    kind: SuggestionKind
    suggestions: AssistantSuggestion[]
  }) => void
  add: (p: { userUuid: string; suggestion: AssistantSuggestion }) => void
  removeTargets: (p: { userUuid: string; surveyId: number | null; id: string; targetKeys: string[] }) => void
  remove: (p: { userUuid: string; surveyId: number | null; id: string }) => void
  dismiss: (p: { userUuid: string; surveyId: number | null; id: string }) => void
  startProgress: (p: { userUuid: string; surveyId: number | null; id: string; conversationId: string }) => void
  onConversationSettled: (p: { userUuid: string; conversationId: string; outcome: SettleOutcome }) => void
  getPending: (p: { userUuid: string; surveyId: number | null }) => AssistantSuggestion[] // raw, for resolvers
  getVisible: (p: {
    userUuid: string
    surveyId: number | null
    cycle: string | null
    availableAreas: AssistantArea[]
    enabled: boolean
  }) => AssistantSuggestion[] // only visible targets; includes Help
  isModuleSeen: (p: { userUuid: string; module: string }) => boolean
  markModuleSeen: (p: { userUuid: string; module: string }) => void
  subscribe: (listener: () => void) => () => void
  clearUser: (userUuid: string) => void
  // conversations accepting a suggestion (reconciled at mount: a reload during a turn)
  getInProgressConversationIds: (userUuid: string) => string[]
}

const KEY_PREFIX = 'arena.ai.suggestions.'

/**
 * Returns the localStorage key of a user's suggestions.
 * @param {string} userUuid - User UUID.
 * @returns {string} The key.
 */
export const getSuggestionsKey = (userUuid: string): string => `${KEY_PREFIX}${userUuid}`

/**
 * Returns true when a storage event may concern suggestions (null: the whole storage was cleared).
 * @param {string|null} key - Changed key.
 * @returns {boolean} True when the subscribers must re-read.
 */
export const isSuggestionsKey = (key: string | null): boolean => key === null || key.startsWith(KEY_PREFIX)

/**
 * Returns the browser's localStorage, or null when it is not accessible.
 * @returns {Storage|null} The storage.
 */
const getLocalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // accessing the property throws when storage is blocked
    return null
  }
}

/**
 * Listens to the window's storage event (writes of the other tabs).
 * @param {Function} listener - Receives the changed key.
 * @returns {Function} Removes the listener.
 */
const addWindowStorageListener = (listener: (key: string | null) => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => listener(event.key)
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

export const browserSuggestionStorageAccess: SuggestionStorageAccess = {
  getStorage: getLocalStorage,
  addStorageListener: addWindowStorageListener,
}

/**
 * Creates a suggestion store.
 * @param {object} [params] - Parameters.
 * @param {SuggestionStorageAccess} [params.access] - Storage access (default: the browser's).
 * @param {Function} [params.now] - Clock (expiry).
 * @returns {SuggestionStore} The store.
 */
export const createSuggestionStore = ({
  access = browserSuggestionStorageAccess,
  now = () => new Date(),
}: { access?: SuggestionStorageAccess; now?: () => Date } = {}): SuggestionStore => {
  const memory = new Map<string, string>()
  // after a failed access the memory copy is the truth: the storage may still hold an older value
  let blocked = false
  const listeners = new Set<() => void>()

  /**
   * Notifies the subscribers.
   * @returns {void}
   */
  const notify = (): void => {
    for (const listener of [...listeners]) listener()
  }

  /**
   * Reads the raw value of a key.
   * @param {string} key - Storage key.
   * @returns {string|null} The JSON, or null.
   */
  const readRaw = (key: string): string | null => {
    if (!blocked) {
      try {
        const storage = access.getStorage()
        if (storage) return storage.getItem(key)
      } catch {
        blocked = true
      }
    }
    return memory.get(key) ?? null
  }

  /**
   * Writes the raw value of a key (memory always, the storage while it works).
   * @param {string} key - Storage key.
   * @param {string} value - JSON.
   * @returns {void}
   */
  const writeRaw = (key: string, value: string): void => {
    memory.set(key, value)
    if (blocked) return
    try {
      const storage = access.getStorage()
      if (storage) storage.setItem(key, value)
      else blocked = true
    } catch {
      blocked = true
    }
  }

  /**
   * Reads the state of a user.
   * @param {string} userUuid - User UUID.
   * @returns {SuggestionUserState} The state.
   */
  const read = (userUuid: string): SuggestionUserState => parseSuggestionState(readRaw(getSuggestionsKey(userUuid)))

  /**
   * Re-reads, changes and writes the state of a user; notifies only when it changed.
   * @param {string} userUuid - User UUID.
   * @param {Function} change - Returns the new state.
   * @returns {void}
   */
  const update = (userUuid: string, change: (state: SuggestionUserState) => SuggestionUserState): void => {
    const key = getSuggestionsKey(userUuid)
    const current = parseSuggestionState(readRaw(key))
    const next = change(current)
    const json = JSON.stringify(next)
    if (json === JSON.stringify(current)) return
    writeRaw(key, json)
    notify()
  }

  // another tab changed suggestions (or cleared the storage): re-read on the next render
  access.addStorageListener((key) => {
    if (isSuggestionsKey(key)) notify()
  })

  return {
    setKind: ({ userUuid, surveyId, kind, suggestions }) =>
      update(userUuid, (state) => withKind(state, { bucket: toBucket(surveyId), kind, suggestions })),
    add: ({ userUuid, suggestion }) => update(userUuid, (state) => withAdded(state, suggestion)),
    removeTargets: ({ userUuid, surveyId, id, targetKeys }) =>
      update(userUuid, (state) => withoutTargets(state, { bucket: toBucket(surveyId), id, targetKeys })),
    remove: ({ userUuid, surveyId, id }) =>
      update(userUuid, (state) => withoutSuggestion(state, { bucket: toBucket(surveyId), id })),
    dismiss: ({ userUuid, surveyId, id }) =>
      update(userUuid, (state) => withDismissed(state, { bucket: toBucket(surveyId), id })),
    startProgress: ({ userUuid, surveyId, id, conversationId }) =>
      update(userUuid, (state) => withProgress(state, { bucket: toBucket(surveyId), id, conversationId })),
    onConversationSettled: ({ userUuid, conversationId, outcome }) =>
      update(userUuid, (state) => withSettled(state, { conversationId, outcome })),
    getPending: ({ userUuid, surveyId }) => getPendingOf(read(userUuid), toBucket(surveyId)),
    getVisible: ({ userUuid, surveyId, cycle, availableAreas, enabled }) =>
      selectVisible(read(userUuid), { surveyId, cycle, availableAreas, enabled, now: now() }),
    isModuleSeen: ({ userUuid, module }) => read(userUuid).seenModules.includes(module),
    markModuleSeen: ({ userUuid, module }) => update(userUuid, (state) => withModuleSeen(state, module)),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    clearUser: (userUuid) => {
      const key = getSuggestionsKey(userUuid)
      memory.delete(key)
      // also after a fallback to memory: an older value may still be in the storage and would come back on reload
      try {
        access.getStorage()?.removeItem(key)
      } catch {
        blocked = true
      }
      notify()
    },
    getInProgressConversationIds: (userUuid) => getInProgressConversationIds(read(userUuid)),
  }
}

export const suggestionStore: SuggestionStore = createSuggestionStore()
