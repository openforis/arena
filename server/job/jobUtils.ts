const jobStatus = {
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  canceled: 'canceled',
  failed: 'failed',
}

const jobEvents = {
  created: 'created',
  statusChange: 'statusChange', //job has changed its status
  progress: 'progress', //job is running and the processed items changed
}

const jobThreadMessageTypes = {
  fetchJob: 'fetchJob',
  cancelJob: 'cancelJob',
}

const calculateJobProgress = job => {
  const partialProgress = job.status === jobStatus.succeeded ?
    100
    : job.total > 0 ?
      Math.floor(100 * job.processed / job.total)
      : 0

  if (job.innerJobs.length === 0 || job.currentInnerJobIndex < 0 || partialProgress === 100) {
    return partialProgress
  } else {
    return partialProgress + Math.floor(calculateJobProgress(job.getCurrentInnerJob()) / job.total)
  }
}

const calculatedElapsedMillis = job =>
  job.startTime
    ? (job.endTime ? job.endTime : new Date()).getTime() - job.startTime.getTime()
    : 0

const jobToJSON = job => ({
  type: job.type,
  userUuid: job.userUuid,
  surveyId: job.surveyId,

  innerJobs: job.innerJobs.map(j => jobToJSON(j)),

  //status
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

  //output
  errors: jobStatus.failed ? job.errors : null,
  result: jobStatus.succeeded ? job.result : null,

})

export {
  jobStatus,
  jobEvents,
  jobThreadMessageTypes,
  jobToJSON,
};
