/**
 * Bridges an async streaming run to the callback + cancel() style the UI components use.
 * @param {object} params - Parameters.
 * @param {Function} params.run - Receives the abort signal; resolves when done.
 * @param {Function} [params.onDone] - Called when the run completes.
 * @param {Function} [params.onError] - Called when the run fails (not after cancel()).
 * @returns {Function} cancel(): aborts the run.
 */
export const runStreamWithCallbacks = ({
  run,
  onDone,
  onError,
}: {
  run: (signal: AbortSignal) => Promise<void>
  onDone?: () => void
  onError?: (error: unknown) => void
}): (() => void) => {
  const controller = new AbortController()
  run(controller.signal).then(
    () => {
      if (!controller.signal.aborted) onDone?.()
    },
    (error) => {
      if (!controller.signal.aborted) onError?.(error)
    }
  )
  return () => controller.abort()
}
