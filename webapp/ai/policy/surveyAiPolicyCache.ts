/**
 * Per-survey cache of the survey AI policy: 30 s TTL, one shared request per survey, and a generation counter so
 * a response started before an update, an invalidation or a reset never overwrites the newer value.
 * Pure (no app imports).
 */
import type { AiPolicy } from '@common/ai/policy'

export type SurveyAiPolicyClientState = { policy: AiPolicy; ceilings: AiPolicy; effective: AiPolicy; canEdit: boolean }

export type SurveyAiPolicyCacheDeps = {
  fetchPolicy: (surveyId: number) => Promise<SurveyAiPolicyClientState>
  putPolicy: (surveyId: number, policy: AiPolicy) => Promise<SurveyAiPolicyClientState>
  now?: () => number
  ttlMs?: number
}

export type SurveyAiPolicyCache = {
  // fresh: never from the cache (and never from a request that started before the call)
  get: (surveyId: number, options?: { fresh?: boolean }) => Promise<SurveyAiPolicyClientState>
  peek: (surveyId: number) => SurveyAiPolicyClientState | null
  update: (surveyId: number, policy: AiPolicy) => Promise<SurveyAiPolicyClientState>
  invalidate: (surveyId: number) => Promise<SurveyAiPolicyClientState>
  reset: () => void
  subscribe: (listener: (surveyId: number) => void) => () => void
}

type Entry = {
  value: SurveyAiPolicyClientState | null
  // generation that was current when `value` was stored
  valueGeneration: number
  fetchedAt: number
  fresh: boolean
  generation: number
  inflight: Promise<Fetched> | null
}

// a server answer, the generation of its request, and whether a newer generation started before it came (then it
// was not stored)
type Fetched = { value: SurveyAiPolicyClientState; superseded: boolean; generation: number }

export const surveyAiPolicyTtlMs = 30_000

let appCache: SurveyAiPolicyCache | null = null

/**
 * Registers the cache of the app, the one `resetSurveyAiPolicyCache` empties.
 * @param {SurveyAiPolicyCache} cache - The app cache.
 * @returns {void}
 */
export const registerAppSurveyAiPolicyCache = (cache: SurveyAiPolicyCache): void => {
  appCache = cache
}

/**
 * Empties the app cache (login and logout): another user must not see policies, or answers in flight, of the
 * previous one. Does nothing when the app cache was never created.
 * @returns {void}
 */
export const resetSurveyAiPolicyCache = (): void => {
  appCache?.reset()
}

/**
 * Creates the cache.
 * @param {SurveyAiPolicyCacheDeps} deps - Transport and clock.
 * @returns {SurveyAiPolicyCache} The cache.
 */
export const createSurveyAiPolicyCache = ({
  fetchPolicy,
  putPolicy,
  now = () => Date.now(),
  ttlMs = surveyAiPolicyTtlMs,
}: SurveyAiPolicyCacheDeps): SurveyAiPolicyCache => {
  const entries = new Map<number, Entry>()
  const listeners = new Set<(surveyId: number) => void>()

  /**
   * Returns the survey's entry, creating it when missing.
   * @param {number} surveyId - Survey id.
   * @returns {Entry} The entry.
   */
  const getEntry = (surveyId: number): Entry => {
    let entry = entries.get(surveyId)
    if (!entry) {
      entry = { value: null, valueGeneration: 0, fetchedAt: 0, fresh: false, generation: 0, inflight: null }
      entries.set(surveyId, entry)
    }
    return entry
  }

  /**
   * Tells the listeners that a survey's entry changed.
   * @param {number} surveyId - Survey id.
   * @returns {void}
   */
  const notify = (surveyId: number): void => {
    for (const listener of listeners) listener(surveyId)
  }

  /**
   * Stores a value as the fresh one and notifies.
   * @param {number} surveyId - Survey id.
   * @param {Entry} entry - The survey entry.
   * @param {SurveyAiPolicyClientState} value - The value to store.
   * @returns {void}
   */
  const store = (surveyId: number, entry: Entry, value: SurveyAiPolicyClientState): void => {
    entry.value = value
    entry.valueGeneration = entry.generation
    entry.fetchedAt = now()
    entry.fresh = true
    notify(surveyId)
  }

  /**
   * Tells whether the entry holds a value within the TTL.
   * @param {Entry} entry - The survey entry.
   * @returns {boolean} True when fresh.
   */
  const isFresh = (entry: Entry): boolean => entry.value !== null && entry.fresh && now() - entry.fetchedAt < ttlMs

  // drops the in-flight request: its response, if it comes, belongs to an older generation
  /**
   * Starts a new generation, dropping the in-flight request.
   * @param {Entry} entry - The survey entry.
   * @returns {void}
   */
  const nextGeneration = (entry: Entry): void => {
    entry.generation += 1
    entry.inflight = null
  }

  /**
   * Starts the shared request of a survey.
   * @param {number} surveyId - Survey id.
   * @param {Entry} entry - The survey entry.
   * @returns {Promise<Fetched>} The server answer; stored only when no newer generation started meanwhile.
   */
  const startFetch = (surveyId: number, entry: Entry): Promise<Fetched> => {
    const { generation } = entry
    const request = (async () => {
      try {
        const value = await fetchPolicy(surveyId)
        const superseded = entry.generation !== generation
        if (!superseded) store(surveyId, entry, value)
        return { value, superseded, generation }
      } finally {
        if (entry.generation === generation) entry.inflight = null
      }
    })()
    entry.inflight = request
    return request
  }

  /**
   * Returns the answer to a caller that accepts the cache: a request that was superseded gives the cached value only
   * when a later generation stored it, otherwise its own (newer than the cached one) server answer.
   * @param {Entry} entry - The survey entry.
   * @param {Promise<Fetched>} request - The shared request.
   * @returns {Promise<SurveyAiPolicyClientState>} The policy state.
   */
  const toCachedAnswer = async (entry: Entry, request: Promise<Fetched>): Promise<SurveyAiPolicyClientState> => {
    const { value, superseded, generation } = await request
    const storedByLater = entry.value !== null && entry.valueGeneration > generation
    return superseded && storedByLater ? (entry.value as SurveyAiPolicyClientState) : value
  }

  /**
   * Drops the cached value and the request in flight, and starts a new request. Its caller gets the server's own
   * answer, never the cached value.
   * @param {number} surveyId - Survey id.
   * @param {Entry} entry - The survey entry.
   * @returns {Promise<SurveyAiPolicyClientState>} The new request.
   */
  const refetch = async (surveyId: number, entry: Entry): Promise<SurveyAiPolicyClientState> => {
    nextGeneration(entry)
    entry.fresh = false
    return (await startFetch(surveyId, entry)).value
  }

  return {
    get: async (surveyId, { fresh = false } = {}) => {
      const entry = getEntry(surveyId)
      if (fresh) return refetch(surveyId, entry)
      if (isFresh(entry)) return entry.value as SurveyAiPolicyClientState
      return toCachedAnswer(entry, entry.inflight ?? startFetch(surveyId, entry))
    },
    peek: (surveyId) => entries.get(surveyId)?.value ?? null,
    update: async (surveyId, policy) => {
      const entry = getEntry(surveyId)
      nextGeneration(entry)
      try {
        const value = await putPolicy(surveyId, policy)
        // a read started while the PUT was running may carry the old value: drop it too
        nextGeneration(entry)
        store(surveyId, entry, value)
        return value
      } catch (error) {
        entry.fresh = false
        throw error
      }
    },
    invalidate: (surveyId) => {
      const request = refetch(surveyId, getEntry(surveyId))
      // callers that only want the refresh ignore the result: a failed refetch must not be an unhandled rejection
      request.catch(() => {})
      notify(surveyId)
      return request
    },
    reset: () => {
      const surveyIds = [...entries.keys()]
      for (const entry of entries.values()) nextGeneration(entry)
      entries.clear()
      for (const surveyId of surveyIds) notify(surveyId)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
