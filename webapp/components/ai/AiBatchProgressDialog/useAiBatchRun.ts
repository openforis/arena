/**
 * State of a browser AI batch shown in AiBatchProgressDialog: one AbortController per run, progress, and the
 * translated error. Closing the dialog or unmounting the owner (leaving the page, closing the tab) cancels the run.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import { getAiErrorMessage, isAiAbortError } from '@webapp/ai/workflows'
import type { AiBatchProgress } from '@webapp/ai/workflows/batchRun'
import { useI18n } from '@webapp/store/system'

export type AiBatchRunState = { titleKey: string; progress: AiBatchProgress | null; error: string | null }

type RunParams = { signal: AbortSignal; onProgress: (progress: AiBatchProgress) => void }

type StartParams<T> = {
  // common namespace key of the dialog title
  titleKey: string
  run: (params: RunParams) => Promise<T>
  onDone: (result: T) => void
}

/**
 * Returns the state of the current run and the functions to start and close it.
 * @returns {object} { run, start, close }.
 */
export const useAiBatchRun = () => {
  const i18n = useI18n()
  const [run, setRun] = useState<AiBatchRunState | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // a local alias of the ref (the controller changes per run, so it must be read when the cleanup runs)
    const ref = controllerRef
    return () => {
      const controller = ref.current
      controller?.abort()
    }
  }, [])

  /**
   * Starts a run (cancelling the previous one) and calls onDone with its result, unless it was cancelled.
   * @param {StartParams} params - Title, run function and completion callback.
   * @returns {Promise<void>} Resolves when the run ends.
   */
  const start = useCallback(
    async <T>({ titleKey, run: runBatch, onDone }: StartParams<T>): Promise<void> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const { signal } = controller
      setRun({ titleKey, progress: null, error: null })
      let completed: { result: T } | null = null
      try {
        const result = await runBatch({
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) setRun((prev) => (prev ? { ...prev, progress } : prev))
          },
        })
        if (signal.aborted) return
        setRun(null)
        completed = { result }
      } catch (error) {
        // cancelled: the dialog is already closed
        if (signal.aborted) return
        // the local server's first-use dialog was closed: nothing to report
        if (isAiAbortError(error)) {
          setRun(null)
          return
        }
        setRun((prev) => ({ titleKey, progress: prev?.progress ?? null, error: getAiErrorMessage({ error, i18n }) }))
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
      // outside the try: an error of onDone is not an AI error and the run is already cleared
      if (completed) onDone(completed.result)
    },
    [i18n]
  )

  /**
   * Cancels the run (if any) and closes the dialog.
   * @returns {void}
   */
  const close = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setRun(null)
  }, [])

  return { run, start, close }
}
