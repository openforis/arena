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
 * @returns {object} The queue: request, getPending, answer, subscribe.
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
     * Asks the user; resolves with their answer.
     * @param {LocalServerConsentRequest} request - What the card shows.
     * @returns {Promise<LocalServerConsentAnswer>} The answer.
     */
    request: (request: LocalServerConsentRequest): Promise<LocalServerConsentAnswer> =>
      new Promise((resolve) => {
        const key = keyOf(request)
        const existing = entries.find((entry) => entry.key === key)
        if (existing) {
          existing.resolvers.push(resolve)
          return
        }
        nextId += 1
        entries.push({ id: nextId, key, request, resolvers: [resolve] })
        changed()
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
export const subscribeConsentRequests = appQueue.subscribe
