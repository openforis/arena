/**
 * Per-survey cache of the survey AI policy: 30 s TTL, one shared request per survey, and a generation counter so
 * a response started before an update or an invalidation never overwrites the newer value. Pure (no app imports).
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
  get: (surveyId: number) => Promise<SurveyAiPolicyClientState>
  peek: (surveyId: number) => SurveyAiPolicyClientState | null
  update: (surveyId: number, policy: AiPolicy) => Promise<SurveyAiPolicyClientState>
  invalidate: (surveyId: number) => void
  subscribe: (listener: (surveyId: number) => void) => () => void
}

type Entry = {
  value: SurveyAiPolicyClientState | null
  fetchedAt: number
  fresh: boolean
  generation: number
  inflight: Promise<SurveyAiPolicyClientState> | null
}

export const surveyAiPolicyTtlMs = 30_000

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
      entry = { value: null, fetchedAt: 0, fresh: false, generation: 0, inflight: null }
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
   * @returns {Promise<SurveyAiPolicyClientState>} The request.
   */
  const startFetch = (surveyId: number, entry: Entry): Promise<SurveyAiPolicyClientState> => {
    const { generation } = entry
    const request = (async () => {
      try {
        const value = await fetchPolicy(surveyId)
        if (entry.generation !== generation) return entry.value ?? value
        store(surveyId, entry, value)
        return value
      } finally {
        if (entry.generation === generation) entry.inflight = null
      }
    })()
    entry.inflight = request
    return request
  }

  return {
    get: async (surveyId) => {
      const entry = getEntry(surveyId)
      if (isFresh(entry)) return entry.value as SurveyAiPolicyClientState
      return entry.inflight ?? startFetch(surveyId, entry)
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
      const entry = getEntry(surveyId)
      nextGeneration(entry)
      entry.fresh = false
      notify(surveyId)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
