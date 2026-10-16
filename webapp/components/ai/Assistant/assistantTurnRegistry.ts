/**
 * Module-level registry of the running turns and in-flight saves, so logout can stop the answers and wait for
 * their final saves before it resets the panel. The saves are not skipped: the conversations stay stored.
 */
import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'

export type AssistantTurnRegistry = {
  register: (controller: AbortController) => void
  unregister: (controller: AbortController) => void
  track: <T>(promise: Promise<T>) => Promise<T>
  abortAll: () => void
  settle: () => Promise<void>
  getGeneration: () => number
}

export const RESET_REASON = 'reset'

// the longest login, logout and survey delete wait for the tracked saves: a hung request must not block them
export const SETTLE_TIMEOUT_MS = 10_000

/**
 * Waits until none of the promises is pending, or until the time is up.
 * @param {Set<Promise<unknown>>} pending - The tracked promises (it changes while waiting).
 * @param {number} timeoutMs - Longest wait.
 * @param {AiLog} log - Called when the time is up.
 * @returns {Promise<void>} Resolves when none is pending or when the time is up; never rejects.
 */
const settleWithin = async (pending: Set<Promise<unknown>>, timeoutMs: number, log: AiLog): Promise<void> => {
  if (pending.size === 0) return
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs)
  })
  const settled = (async () => {
    while (pending.size > 0) await Promise.allSettled([...pending])
    return 'settled' as const
  })()
  try {
    if ((await Promise.race([settled, timedOut])) === 'timeout') {
      log(`The assistant saves did not end within ${timeoutMs} ms; going on without them`)
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Creates a turn registry.
 * @param {object} [options] - Options.
 * @param {number} [options.settleTimeoutMs] - Longest wait of `settle`.
 * @param {AiLog} [options.log] - Receives the warning when `settle` times out.
 * @returns {AssistantTurnRegistry} The registry.
 */
export const createAssistantTurnRegistry = ({
  settleTimeoutMs = SETTLE_TIMEOUT_MS,
  log = logAiWarning,
}: { settleTimeoutMs?: number; log?: AiLog } = {}): AssistantTurnRegistry => {
  const controllers = new Set<AbortController>()
  const pending = new Set<Promise<unknown>>()
  // bumped by abortAll: work started before a reset must not update the UI afterwards (it still saves)
  let generation = 0
  return {
    register: (controller) => {
      controllers.add(controller)
    },
    unregister: (controller) => {
      controllers.delete(controller)
    },
    track: (promise) => {
      const settled = promise.then(
        () => undefined,
        () => undefined
      )
      pending.add(settled)
      void settled.then(() => pending.delete(settled))
      return promise
    },
    abortAll: () => {
      generation += 1
      for (const controller of controllers) controller.abort(RESET_REASON)
      controllers.clear()
    },
    settle: () => settleWithin(pending, settleTimeoutMs, log),
    getGeneration: () => generation,
  }
}

export const assistantTurnRegistry = createAssistantTurnRegistry()

/**
 * Aborts every running assistant turn for a reset (logout): their last state is saved but they no longer update the UI.
 * @returns {void}
 */
export const abortAssistantTurns = (): void => assistantTurnRegistry.abortAll()

/**
 * Waits for the tracked turns and saves (an aborted turn ends with a final save), but not longer than the timeout.
 * @returns {Promise<void>} Resolves when none is pending or the time is up.
 */
export const settleAssistantSaves = (): Promise<void> => assistantTurnRegistry.settle()
