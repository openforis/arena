export const jobStatus = {
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  canceled: 'canceled',
  failed: 'failed',
}

export const jobEvents = {
  created: 'created',
  statusChange: 'statusChange', // Job has changed its status
  progress: 'progress', // Job is running and the processed items changed
}

export const jobThreadMessageTypes = {
  fetchJob: 'fetchJob',
  cancelJob: 'cancelJob',
}

const calculateJobProgress = job => {
  const partialProgress = job.status === jobStatus.succeeded
    ? 100
    : (job.total > 0
      ? Math.floor(100 * job.processed / job.total)
      : 0)

  if (job.innerJobs.length === 0 || job.currentInnerJobIndex < 0 || partialProgress === 100) {
    return partialProgress
  }

  return partialProgress + Math.floor(calculateJobProgress(job.getCurrentInnerJob()) / job.total)
}

const calculatedElapsedMillis = job =>
  job.startTime
    ? (job.endTime ? job.endTime : new Date()).getTime() - job.startTime.getTime()
    : 0

export const jobToJSON = job => ({
  type: job.type,
  userUuid: job.userUuid,
  surveyId: job.surveyId,

  innerJobs: job.innerJobs.map(j => jobToJSON(j)),

  // Status
  status: job.status,
  pending: job.status === jobStatus.pending,
  running: job.status === jobStatus.running,
  succeeded: job.status === jobStatus.succeeded,
  canceled: job.status === jobStatus.canceled,
  failed: job.status === jobStatus.failed,
  ended: job.isEnded(),

  total: job.total,
  processed: job.processed,
  progressPercent: calculateJobProgress(job),
  elapsedMillis: calculatedElapsedMillis(job),

  // Output
  errors: jobStatus.failed ? job.errors : null,
  result: jobStatus.succeeded ? job.result : null,

})
