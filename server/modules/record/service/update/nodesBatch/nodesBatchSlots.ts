/**
 * Admission control of the batch record edits: one records update thread serves every survey of a process, so a few
 * batches in flight are enough to stall data entry for everyone. A batch needs a slot for its whole duration.
 *
 * The slots are per process (per dyno) on purpose. What a batch stalls is the records update thread of the process
 * that runs it, and each process has its own, so the limits count what that thread has to serve. A shared counter
 * would need a store that all dynos agree on, and the slots of a crashed dyno would leak until a timeout. What must be
 * serialized across dynos is the writing of one record, and the thread already does that with a per-record advisory
 * lock (a transaction waits up to its lock timeout for a record that another dyno holds, then fails with
 * record.lockTimeout). So with N dynos the server accepts up to N times these limits, while two batches on the same
 * record still run one after the other, whichever dynos they reach.
 */

export type NodesBatchSlotLimits = {
  // batches in flight of one user
  perUser: number
  // batches in flight of one survey (all its users)
  perSurvey: number
  // batches in flight of the process
  total: number
}

export type NodesBatchSlotScope = 'user' | 'survey' | 'server'

export type NodesBatchSlotResult = { ok: true; release: () => void } | { ok: false; scope: NodesBatchSlotScope }

export type NodesBatchSlots = {
  tryAcquire: (params: { userUuid: string; surveyId: number }) => NodesBatchSlotResult
  // number of batches in flight
  size: () => number
}

export const defaultNodesBatchSlotLimits: NodesBatchSlotLimits = { perUser: 1, perSurvey: 2, total: 4 }

/**
 * Adds a delta to the counter of a key, dropping the key at zero.
 * @param {Map} counters - The counters.
 * @param {string|number} key - The key.
 * @param {number} delta - The delta.
 * @returns {void}
 */
const addToCounter = <K>(counters: Map<K, number>, key: K, delta: number): void => {
  const count = (counters.get(key) ?? 0) + delta
  if (count > 0) counters.set(key, count)
  else counters.delete(key)
}

/**
 * Creates the slots of a process.
 * @param {NodesBatchSlotLimits} [limits] - The limits.
 * @returns {NodesBatchSlots} The slots.
 */
export const createNodesBatchSlots = (limits: NodesBatchSlotLimits = defaultNodesBatchSlotLimits): NodesBatchSlots => {
  const byUser = new Map<string, number>()
  const bySurvey = new Map<number, number>()
  let total = 0

  const findRefusedScope = (userUuid: string, surveyId: number): NodesBatchSlotScope | null => {
    if ((byUser.get(userUuid) ?? 0) >= limits.perUser) return 'user'
    if ((bySurvey.get(surveyId) ?? 0) >= limits.perSurvey) return 'survey'
    return total >= limits.total ? 'server' : null
  }

  const tryAcquire = ({ userUuid, surveyId }: { userUuid: string; surveyId: number }): NodesBatchSlotResult => {
    const scope = findRefusedScope(userUuid, surveyId)
    if (scope) return { ok: false, scope }
    addToCounter(byUser, userUuid, 1)
    addToCounter(bySurvey, surveyId, 1)
    total += 1
    let released = false
    // idempotent: a slot is given back once, whatever path ends the batch
    const release = () => {
      if (released) return
      released = true
      addToCounter(byUser, userUuid, -1)
      addToCounter(bySurvey, surveyId, -1)
      total -= 1
    }
    return { ok: true, release }
  }

  return { tryAcquire, size: () => total }
}

// the slots of this process
export const NodesBatchProcessSlots = createNodesBatchSlots()
