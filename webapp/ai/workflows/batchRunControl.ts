/**
 * Control of one browser AI batch run, and what the UI does when the run settles. A user's Stop aborts the calls but
 * keeps the run (the results so far are wanted); abandoning it (closing after an error, leaving the page, starting
 * another run) discards it. Framework-free.
 */
import { isAiAbortError } from '../runtime/runtimeErrors'
import type { AiBatchStop } from './batchRun'

export type BatchRunControl = {
  // aborted by a stop request and by abandoning: pass it to the workflow's calls
  signal: AbortSignal
  // aborted only by abandoning: for the step after a stopped run (the export of the partial results)
  abandonSignal: AbortSignal
  requestStop: () => void
  abandon: () => void
  // the user stopped the run and it was not abandoned since
  isStopRequested: () => boolean
  isAbandoned: () => boolean
}

/**
 * Creates the control of a run.
 * @returns {BatchRunControl} The control.
 */
export const createBatchRunControl = (): BatchRunControl => {
  const controller = new AbortController()
  const abandonController = new AbortController()
  let stopRequested = false
  let abandoned = false
  return {
    signal: controller.signal,
    abandonSignal: abandonController.signal,
    requestStop: () => {
      stopRequested = true
      controller.abort()
    },
    abandon: () => {
      abandoned = true
      abandonController.abort()
      controller.abort()
    },
    isStopRequested: () => stopRequested && !abandoned,
    isAbandoned: () => abandoned,
  }
}

export type BatchSettled<T> = { result: T } | { error: unknown }

export type BatchOutcome<T> =
  // the run was abandoned: nothing to show or apply
  | { kind: 'discarded' }
  // stopped with nothing to keep, or the first-use dialog of the local server was closed: close the dialog
  | { kind: 'closed' }
  | { kind: 'failed'; error: unknown }
  // finished, or stopped with results: the stop says where
  | { kind: 'done'; result: T; stop: AiBatchStop | null }

/**
 * Returns what to do with a run that ended.
 * @param {object} params - Parameters.
 * @param {BatchSettled} params.settled - The result of the run, or its error.
 * @param {BatchRunControl} params.control - Control of the run.
 * @param {Function} params.getStop - Returns the stop reported in a result, if any.
 * @returns {BatchOutcome} The outcome.
 */
export const settleBatchRun = <T>({
  settled,
  control,
  getStop,
}: {
  settled: BatchSettled<T>
  control: BatchRunControl
  getStop: (result: T) => AiBatchStop | null
}): BatchOutcome<T> => {
  if (control.isAbandoned()) return { kind: 'discarded' }
  if ('error' in settled) {
    return isAiAbortError(settled.error) ? { kind: 'closed' } : { kind: 'failed', error: settled.error }
  }
  return { kind: 'done', result: settled.result, stop: getStop(settled.result) }
}
