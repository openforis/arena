import type Job from './job'
import { jobStatus } from './jobUtils'

/**
 * Starts the specified job and ensures that its end is always notified, even when the job terminates
 * without reaching an end status (e.g. an error occurs before it starts running) or without notifying it
 * (e.g. an error occurs while ending); in those cases the job is marked as failed.
 * Otherwise the job queue would consider the job still active, preventing the user from running other jobs.
 * isEndNotified returns true if the end of the job has already been notified; notifyJob notifies the job state.
 */
export const startJobEnsuringEndNotification = async ({
  job,
  isEndNotified,
  notifyJob,
  logger = null,
}: {
  job: Job
  isEndNotified: () => boolean
  notifyJob: () => void
  logger?: { error: (...msgs: unknown[]) => void } | null
}): Promise<void> => {
  let startError: unknown = null
  try {
    await job.start()
  } catch (error) {
    logger?.error(`Error running job ${job.type} (${job.uuid}): ${error.stack ?? error}`)
    startError = error
  }
  if (isEndNotified()) return

  if (!job.isEnded()) {
    // the job is ended from outside: addError and status are not public
    const jobToEnd = job as any
    const { key, params } = job.getErrorInfo(startError ?? new Error('Job terminated unexpectedly'))
    jobToEnd.addError({ error: { valid: false, errors: [{ key, params }] } })
    try {
      // set the status through the job, so that its end is handled as usual (e.g. onEnd cleanup, end event notification)
      await job.setStatusFailed()
    } catch (error) {
      // an error occurred while ending the job (e.g. in onEnd): the end hasn't been notified
      logger?.error(`Error ending job ${job.type} (${job.uuid}): ${error.stack ?? error}`)
      jobToEnd.status = jobStatus.failed
    }
    if (isEndNotified()) return
  }
  notifyJob()
}
