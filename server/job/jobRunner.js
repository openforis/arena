import { jobStatus } from './jobUtils'

/**
 * Starts the specified job and ensures that its end is always notified, even when the job terminates
 * without reaching an end status (e.g. an error occurs before it starts running) or without notifying it
 * (e.g. an error occurs while ending); in those cases the job is marked as failed.
 * Otherwise the job queue would consider the job still active, preventing the user from running other jobs.
 * @param {!object} params - The parameters.
 * @param {!object} params.job - The job to start.
 * @param {!function(): boolean} params.isEndNotified - Function returning true if the end of the job has already been notified.
 * @param {!function(): void} params.notifyJob - Function that notifies the current state of the job.
 * @param {object} [params.logger] - Logger used to log errors thrown by the job.
 * @returns {Promise<void>} - Resolved once the job has ended and its end has been notified.
 */
export const startJobEnsuringEndNotification = async ({ job, isEndNotified, notifyJob, logger = null }) => {
  let startError = null
  try {
    await job.start()
  } catch (error) {
    logger?.error(`Error running job ${job.type} (${job.uuid}): ${error.stack ?? error}`)
    startError = error
  }
  if (isEndNotified()) return

  if (!job.isEnded()) {
    const { key, params } = job.getErrorInfo(startError ?? new Error('Job terminated unexpectedly'))
    job.addError({ error: { valid: false, errors: [{ key, params }] } })
    job.status = jobStatus.failed
  }
  notifyJob()
}
