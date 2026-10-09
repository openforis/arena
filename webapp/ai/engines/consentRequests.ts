/**
 * Pending first-use consent requests for the local AI server, shown one at a time by LocalServerConsentHost.
 * Concurrent requests for the same survey and server share one dialog and one answer.
 */
import type { LocalServerConsentAnswer, LocalServerConsentRequest } from './resolveModel'

export type PendingConsentRequest = LocalServerConsentRequest & { id: number }

type Entry = {
  id: number
  key: string
  request: LocalServerConsentRequest
  resolvers: ((answer: LocalServerConsentAnswer) => void)[]
}

/**
 * Returns the key two requests share when they must show one dialog.
 * @param {LocalServerConsentRequest} request - The request.
 * @returns {string} The key (survey, server URL and whether another engine is offered).
 */
const keyOf = ({ surveyId, baseUrl, canUseOther }: LocalServerConsentRequest): string =>
  `${surveyId ?? 'none'}|${baseUrl}|${canUseOther}`

/**
 * Creates a consent request queue.
 * @returns {object} The queue: request, getPending, answer, cancelAll, subscribe.
 */
export const createConsentRequestQueue = () => {
  const entries: Entry[] = []
  const listeners = new Set<() => void>()
  let nextId = 0
  let pending: PendingConsentRequest | null = null

  /**
   * Refreshes the pending snapshot and notifies the subscribers.
   * @returns {void}
   */
  const changed = (): void => {
    const first = entries[0]
    pending = first ? { id: first.id, ...first.request } : null
    for (const listener of [...listeners]) listener()
  }

  return {
    /**
     * Asks the user; resolves with their answer ('cancel' when the signal aborts: the dialog closes if nobody else waits).
     * @param {LocalServerConsentRequest} request - What the card shows.
     * @param {AbortSignal} [signal] - Aborts this caller's wait.
     * @returns {Promise<LocalServerConsentAnswer>} The answer.
     */
    request: (request: LocalServerConsentRequest, signal?: AbortSignal): Promise<LocalServerConsentAnswer> =>
      new Promise((resolve) => {
        if (signal?.aborted) {
          resolve('cancel')
          return
        }
        const key = keyOf(request)
        const existing = entries.find((entry) => entry.key === key)
        // resolves this caller only, and drops the dialog when nobody else waits for it
        const entry: Entry = existing ?? { id: (nextId += 1), key, request, resolvers: [] }
        const abandon = () => {
          entry.resolvers = entry.resolvers.filter((candidate) => candidate !== settle)
          resolve('cancel')
          if (entry.resolvers.length === 0 && entries.includes(entry)) {
            entries.splice(entries.indexOf(entry), 1)
            changed()
          }
        }
        const settle = (answer: LocalServerConsentAnswer) => {
          signal?.removeEventListener('abort', abandon)
          resolve(answer)
        }
        signal?.addEventListener('abort', abandon, { once: true })
        entry.resolvers.push(settle)
        if (!existing) {
          entries.push(entry)
          changed()
        }
      }),
    /**
     * Returns the request the dialog must show (same object until the queue changes).
     * @returns {PendingConsentRequest|null} The request.
     */
    getPending: (): PendingConsentRequest | null => pending,
    /**
     * Answers a request (unknown ids are ignored).
     * @param {number} id - Request id.
     * @param {LocalServerConsentAnswer} answer - The answer.
     * @returns {void}
     */
    answer: (id: number, answer: LocalServerConsentAnswer): void => {
      const index = entries.findIndex((entry) => entry.id === id)
      if (index < 0) return
      const [entry] = entries.splice(index, 1)
      for (const resolve of entry.resolvers) resolve(answer)
      changed()
    },
    /**
     * Cancels every pending request (login, logout: a dialog must not outlive the user who triggered it).
     * @returns {void}
     */
    cancelAll: (): void => {
      const cancelled = entries.splice(0, entries.length)
      for (const entry of cancelled) for (const resolve of entry.resolvers) resolve('cancel')
      changed()
    },
    /**
     * Subscribes to queue changes.
     * @param {Function} listener - Called after every change.
     * @returns {Function} Unsubscribe.
     */
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

const appQueue = createConsentRequestQueue()

export const requestLocalServerConsent = appQueue.request
export const getPendingConsentRequest = appQueue.getPending
export const answerConsentRequest = appQueue.answer
export const cancelAllConsentRequests = appQueue.cancelAll
export const subscribeConsentRequests = appQueue.subscribe
