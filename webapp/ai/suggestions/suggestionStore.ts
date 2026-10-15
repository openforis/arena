/**
 * The suggestions of each user, in localStorage under `arena.ai.suggestions.<userUuid>`. Every mutation re-reads the
 * key, applies the change and writes it back in one synchronous step; the `storage` event of the other tabs notifies
 * the subscribers. When the storage is blocked or full, the values live in memory for the session.
 */
import { logAiWarning } from '@webapp/ai/log/aiLog'
import {
  createResilientStorage,
  getBrowserLocalStorage,
  type ResilientStorageBackend,
} from '@webapp/ai/storage/resilientStorage'
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import {
  HELP_BUCKET,
  getBucketOfConversation,
  getInProgressConversationIds,
  getPendingOf,
  getTrackedOf,
  normalizeSuggestionState,
  parseSuggestionState,
  selectVisible,
  shrinkSuggestionState,
  toBucket,
  withAdded,
  withDismissed,
  withKind,
  withModuleSeen,
  withoutBucket,
  withoutSuggestion,
  withoutTargets,
  withProgress,
  withSettled,
  type SuggestionUserState,
  type TrackedSuggestion,
} from './suggestionState'
import type { AssistantSuggestion, SettleOutcome, SuggestionKind } from './types'

export type SuggestionStorageAccess = {
  getStorage: () => ResilientStorageBackend | null // null: blocked → memory fallback
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
  startProgress: (p: {
    userUuid: string
    surveyId: number | null
    id: string
    conversationId: string
    // the targets sent to the model; the visible ones outside it (merged meanwhile) stay pending
    targetKeys?: string[]
  }) => void
  onConversationSettled: (p: { userUuid: string; conversationId: string; outcome: SettleOutcome }) => void
  getPending: (p: { userUuid: string; surveyId: number | null }) => AssistantSuggestion[] // raw, for resolvers
  // every suggestion the state holds something of (pending, dismissed or in progress), so resolvers also reach the
  // dismissed targets of a suggestion that is no longer pending
  getTracked: (p: { userUuid: string; surveyId: number | null }) => TrackedSuggestion[]
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
  // forgets the survey's suggestions of every user of this browser (the survey was deleted)
  removeSurvey: (surveyId: number) => void
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
  getStorage: getBrowserLocalStorage,
  addStorageListener: addWindowStorageListener,
}

/**
 * Creates a suggestion store.
 * @param {object} [params] - Parameters.
 * @param {SuggestionStorageAccess} [params.access] - Storage access (default: the browser's).
 * @param {Function} [params.now] - Clock (expiry).
 * @param {Function} [params.log] - Reports what the storage wrapper recovered from.
 * @returns {SuggestionStore} The store.
 */
export const createSuggestionStore = ({
  access = browserSuggestionStorageAccess,
  now = () => new Date(),
  log,
}: {
  access?: SuggestionStorageAccess
  now?: () => Date
  log?: (message: string, error?: unknown) => void
} = {}): SuggestionStore => {
  const storage = createResilientStorage({ getStorage: () => access.getStorage(), log })
  const listeners = new Set<() => void>()
  // a corrupt value is read many times before the next write replaces it: reported once
  let reportedCorrupt: string | null = null

  /**
   * Parses a stored value; a corrupt one is reported (it loses the dismissals) and replaced by an empty state.
   * @param {string|null} raw - Stored JSON.
   * @returns {SuggestionUserState} The state.
   */
  const parse = (raw: string | null): SuggestionUserState =>
    parseSuggestionState(raw, (error) => {
      if (raw === reportedCorrupt) return
      reportedCorrupt = raw
      ;(log ?? logAiWarning)('The stored suggestions are corrupt: they were reset, and the dismissals are lost', error)
    })

  /**
   * Notifies the subscribers.
   * @returns {void}
   */
  const notify = (): void => {
    for (const listener of [...listeners]) listener()
  }

  /**
   * Reads the state of a user.
   * @param {string} userUuid - User UUID.
   * @returns {SuggestionUserState} The state.
   */
  const read = (userUuid: string): SuggestionUserState => parse(storage.read(getSuggestionsKey(userUuid)))

  /**
   * Re-reads, changes and writes the state of a user; notifies only when it changed. The state is kept within its
   * bounds (expired suggestions go); a full storage gets a smaller state, level by level, and the wrapper logs it.
   * @param {string} userUuid - User UUID.
   * @param {Function} change - Returns the new state.
   * @param {string|null} [keepBucket] - The bucket being changed: it is never dropped to stay within the bounds.
   * @returns {void}
   */
  const update = (
    userUuid: string,
    change: (state: SuggestionUserState) => SuggestionUserState,
    keepBucket: string | null = null
  ): void => {
    const key = getSuggestionsKey(userUuid)
    const current = parse(storage.read(key))
    const options = { keepBucket }
    const next = normalizeSuggestionState(change(current), now(), options)
    const json = JSON.stringify(next)
    if (json === JSON.stringify(current)) return
    storage.write(key, json, (level) => {
      const smaller = shrinkSuggestionState(next, level, now(), options)
      return smaller && JSON.stringify(smaller)
    })
    notify()
  }

  // another tab changed suggestions (or cleared the storage): re-read on the next render
  access.addStorageListener((key) => {
    if (isSuggestionsKey(key)) notify()
  })

  return {
    setKind: ({ userUuid, surveyId, kind, suggestions }) =>
      update(
        userUuid,
        (state) => withKind(state, { bucket: toBucket(surveyId), kind, suggestions }),
        toBucket(surveyId)
      ),
    add: ({ userUuid, suggestion }) =>
      update(userUuid, (state) => withAdded(state, suggestion), toBucket(suggestion.surveyId)),
    removeTargets: ({ userUuid, surveyId, id, targetKeys }) =>
      update(
        userUuid,
        (state) => withoutTargets(state, { bucket: toBucket(surveyId), id, targetKeys }),
        toBucket(surveyId)
      ),
    remove: ({ userUuid, surveyId, id }) =>
      update(userUuid, (state) => withoutSuggestion(state, { bucket: toBucket(surveyId), id }), toBucket(surveyId)),
    dismiss: ({ userUuid, surveyId, id }) =>
      update(userUuid, (state) => withDismissed(state, { bucket: toBucket(surveyId), id }), toBucket(surveyId)),
    startProgress: ({ userUuid, surveyId, id, conversationId, targetKeys }) =>
      update(
        userUuid,
        (state) => withProgress(state, { bucket: toBucket(surveyId), id, conversationId, targetKeys }),
        toBucket(surveyId)
      ),
    onConversationSettled: ({ userUuid, conversationId, outcome }) =>
      update(
        userUuid,
        (state) => withSettled(state, { conversationId, outcome }),
        // the survey the conversation was for must survive the write that settles it
        getBucketOfConversation(read(userUuid), conversationId)
      ),
    getPending: ({ userUuid, surveyId }) => getPendingOf(read(userUuid), toBucket(surveyId)),
    getTracked: ({ userUuid, surveyId }) => getTrackedOf(read(userUuid), toBucket(surveyId)),
    getVisible: ({ userUuid, surveyId, cycle, availableAreas, enabled }) =>
      selectVisible(read(userUuid), { surveyId, cycle, availableAreas, enabled, now: now() }),
    isModuleSeen: ({ userUuid, module }) => read(userUuid).seenModules.includes(module),
    markModuleSeen: ({ userUuid, module }) => update(userUuid, (state) => withModuleSeen(state, module), HELP_BUCKET),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    clearUser: (userUuid) => {
      storage.remove(getSuggestionsKey(userUuid))
      notify()
    },
    removeSurvey: (surveyId) => {
      for (const key of storage.keys(KEY_PREFIX)) {
        const current = parse(storage.read(key))
        const next = withoutBucket(current, toBucket(surveyId))
        if (JSON.stringify(next) !== JSON.stringify(current)) storage.write(key, JSON.stringify(next))
      }
      notify()
    },
    getInProgressConversationIds: (userUuid) => getInProgressConversationIds(read(userUuid)),
  }
}

export const suggestionStore: SuggestionStore = createSuggestionStore()
