/**
 * Reply channel of the records update thread: the thread messages are fire-and-forget, so a batch request
 * waits here for the reply posted back with the same requestId.
 */
import { NodesBatchEditResult, NodesBatchLimits } from './nodesBatchTypes'

type Timer = ReturnType<typeof setTimeout>

type PendingReply = { resolve: (results: NodesBatchEditResult[] | null) => void; timer: Timer }

export type NodesBatchReplyRegistry = {
  waitFor: (requestId: string) => Promise<NodesBatchEditResult[] | null>
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
   * @returns {Promise<NodesBatchEditResult[]|null>} The results, or null.
   */
  const waitFor = (requestId: string): Promise<NodesBatchEditResult[] | null> =>
    new Promise((resolve) => {
      const timer = setTimer(() => {
        pending.delete(requestId)
        resolve(null)
      }, timeoutMs)
      pending.set(requestId, { resolve, timer })
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

  return { waitFor, resolveReply, size: () => pending.size }
}

export const NodesBatchReplies = createNodesBatchReplyRegistry()
