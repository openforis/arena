/**
 * State of a browser AI batch shown in AiBatchProgressDialog: one run control per run, progress, and the translated
 * error. A Stop keeps the results so far; closing after an error, leaving the page or starting another run abandons
 * the run.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { getAiErrorMessage } from '@webapp/ai/workflows'
import type { AiBatchProgress, AiBatchStop } from '@webapp/ai/workflows/batchRun'
import { type BatchRunControl, createBatchRunControl, settleBatchRun } from '@webapp/ai/workflows/batchRunControl'
import { NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'

import { getBatchStopText } from './batchStopText'

export type AiBatchRunState = {
  titleKey: string
  progress: AiBatchProgress | null
  error: string | null
  // the user asked to stop: waiting for the call in flight
  stopping: boolean
}

type RunParams = {
  // aborted by a Stop and by abandoning the run: for the AI calls
  signal: AbortSignal
  // aborted only by abandoning the run: for the step that uses the results of a stopped run
  abandonSignal: AbortSignal
  onProgress: (progress: AiBatchProgress) => void
}

// a run that stopped before its last call says so in `stop`
type StartParams<T extends { stop?: AiBatchStop | null }> = {
  // common namespace key of the dialog title
  titleKey: string
  run: (params: RunParams) => Promise<T>
  onDone: (result: T) => void
}

const stopNoticeTimeoutMs = 20000

/**
 * Returns the state of the current run and the functions to start and close it.
 * @returns {object} { run, start, close }; close() stops a running batch (its results so far are kept) and closes
 * the dialog of a finished one.
 */
export const useAiBatchRun = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const [run, setRun] = useState<AiBatchRunState | null>(null)
  const controlRef = useRef<BatchRunControl | null>(null)

  useEffect(() => {
    // a local alias of the ref (the control changes per run, so it must be read when the cleanup runs)
    const ref = controlRef
    return () => {
      ref.current?.abandon()
    }
  }, [])

  /**
   * Starts a run (abandoning the previous one) and calls onDone with its result, unless it was abandoned. A run
   * stopped with results calls onDone too, after a notice of where it stopped.
   * @param {StartParams} params - Title, run function and completion callback.
   * @returns {Promise<void>} Resolves when the run ends.
   */
  const start = useCallback(
    async <T extends { stop?: AiBatchStop | null }>({ titleKey, run: runBatch, onDone }: StartParams<T>) => {
      controlRef.current?.abandon()
      const control = createBatchRunControl()
      controlRef.current = control
      setRun({ titleKey, progress: null, error: null, stopping: false })
      const settled = await runBatch({
        signal: control.signal,
        abandonSignal: control.abandonSignal,
        onProgress: (progress) => {
          if (!control.isAbandoned()) setRun((prev) => (prev ? { ...prev, progress } : prev))
        },
      }).then(
        (result) => ({ result }),
        (error: unknown) => ({ error })
      )
      if (controlRef.current === control) controlRef.current = null
      const outcome = settleBatchRun({ settled, control, getStop: (result) => result.stop ?? null })
      // abandoned: the dialog is closed or belongs to the next run
      if (outcome.kind === 'discarded') return
      if (outcome.kind === 'failed') {
        const error = getAiErrorMessage({ error: outcome.error, i18n })
        setRun((prev) => ({ titleKey, progress: prev?.progress ?? null, error, stopping: false }))
        return
      }
      setRun(null)
      // the run is cleared before onDone: an error of onDone is not an AI error
      if (outcome.kind === 'done') {
        if (outcome.stop) {
          const text = getBatchStopText({ stop: outcome.stop, i18n })
          dispatch(
            NotificationActions.notifyWarning({
              key: undefined,
              params: undefined,
              text,
              timeout: stopNoticeTimeoutMs,
            }) as any
          )
        }
        onDone(outcome.result)
      }
    },
    [dispatch, i18n]
  )

  /**
   * Stops a running batch (the calls in flight are aborted, the results so far are kept), or closes the dialog of
   * a batch that failed.
   * @returns {void}
   */
  const close = useCallback(() => {
    const control = controlRef.current
    if (!control) {
      setRun(null)
      return
    }
    control.requestStop()
    setRun((prev) => (prev ? { ...prev, stopping: true } : prev))
  }, [])

  return { run, start, close }
}
