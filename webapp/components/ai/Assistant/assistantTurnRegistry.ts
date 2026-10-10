/**
 * Module-level registry of the running turns and in-flight saves, so logout can stop the answers and wait for
 * their final saves before it resets the panel. The saves are not skipped: the conversations stay stored.
 */

export type AssistantTurnRegistry = {
  register: (controller: AbortController) => void
  unregister: (controller: AbortController) => void
  track: <T>(promise: Promise<T>) => Promise<T>
  abortAll: () => void
  settle: () => Promise<void>
  getGeneration: () => number
}

export const RESET_REASON = 'reset'

/**
 * Creates a turn registry.
 * @returns {AssistantTurnRegistry} The registry.
 */
export const createAssistantTurnRegistry = (): AssistantTurnRegistry => {
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
    settle: async () => {
      while (pending.size > 0) await Promise.allSettled([...pending])
    },
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
 * Waits for the tracked turns and saves (an aborted turn ends with a final save).
 * @returns {Promise<void>} Resolves when none is pending.
 */
export const settleAssistantSaves = (): Promise<void> => assistantTurnRegistry.settle()
