/**
 * Reply channel of the records update thread: the thread messages are fire-and-forget, so a batch request
 * waits here for the reply posted back with the same requestId.
 */
import { NodesBatchEditResult, NodesBatchLimits } from './nodesBatchTypes'

type Timer = ReturnType<typeof setTimeout>

type PendingReply = { resolve: (results: NodesBatchEditResult[] | null) => void; timer: Timer }

export type NodesBatchReplyRegistry = {
  waitFor: (requestId: string, timeoutMs?: number) => Promise<NodesBatchEditResult[] | null>
  resolveReply: (reply: { requestId: string; results: NodesBatchEditResult[] }) => boolean
  size: () => number
}

/**
 * Creates a registry of pending replies.
 * @param {object} [options] - The options.
 * @param {number} [options.timeoutMs] - How long to wait for a reply (60 s by default).
 * @param {Function} [options.setTimer] - Timer scheduler (setTimeout).
 * @param {Function} [options.clearTimer] - Timer cancel (clearTimeout).
 * @returns {NodesBatchReplyRegistry} The registry.
 */
export const createNodesBatchReplyRegistry = ({
  timeoutMs = NodesBatchLimits.replyTimeoutMs,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}: {
  timeoutMs?: number
  setTimer?: (fn: () => void, ms: number) => Timer
  clearTimer?: (timer: Timer) => void
} = {}): NodesBatchReplyRegistry => {
  const pending = new Map<string, PendingReply>()

  /**
   * Waits for the reply of a request; resolves null on timeout (the entry is then dropped).
   * @param {string} requestId - The request id.
   * @param {number} [waitMs] - How long to wait for this request (never more than the registry timeout, which is the default).
   * @returns {Promise<NodesBatchEditResult[]|null>} The results, or null.
   */
  const waitFor = (requestId: string, waitMs: number = timeoutMs): Promise<NodesBatchEditResult[] | null> =>
    new Promise((resolve) => {
      const entry: PendingReply = {
        resolve,
        timer: setTimer(
          () => {
            // only drop our own entry: the id may have been reused since
            if (pending.get(requestId) === entry) pending.delete(requestId)
            resolve(null)
          },
          Math.min(waitMs, timeoutMs)
        ),
      }
      pending.set(requestId, entry)
    })

  /**
   * Resolves a pending request with the thread reply.
   * @param {object} reply - The reply.
   * @param {string} reply.requestId - The request id.
   * @param {NodesBatchEditResult[]} reply.results - The results.
   * @returns {boolean} False when nobody waits for it (unknown or timed out).
   */
  const resolveReply = ({ requestId, results }: { requestId: string; results: NodesBatchEditResult[] }): boolean => {
    const entry = pending.get(requestId)
    if (!entry) return false
    pending.delete(requestId)
    clearTimer(entry.timer)
    entry.resolve(results)
    return true
  }

  /**
   * Counts the pending requests.
   * @returns {number} The number of requests waiting for a reply.
   */
  const size = (): number => pending.size

  return { waitFor, resolveReply, size }
}

export const NodesBatchReplies = createNodesBatchReplyRegistry()
