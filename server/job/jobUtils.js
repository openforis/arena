import * as JobSerialized from '@common/job/jobSerialized'

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

const calculateJobProgress = (job) => {
  const partialProgress =
    job.status === jobStatus.succeeded ? 100 : job.total > 0 ? Math.floor((100 * job.processed) / job.total) : 0

  if (job.innerJobs.length === 0 || job.currentInnerJobIndex < 0 || partialProgress === 100) {
    return partialProgress
  }

  return partialProgress + Math.floor(calculateJobProgress(job.getCurrentInnerJob()) / job.total)
}

const calculatedElapsedMillis = (job) =>
  job.startTime ? (job.endTime ? job.endTime : new Date()).getTime() - job.startTime.getTime() : 0

export const jobToJSON = (job) => ({
  [JobSerialized.keys.uuid]: job.uuid,
  [JobSerialized.keys.type]: job.type,
  [JobSerialized.keys.userUuid]: job.userUuid,
  [JobSerialized.keys.surveyId]: job.surveyId,

  [JobSerialized.keys.innerJobs]: job.innerJobs.map(jobToJSON),

  // Status
  [JobSerialized.keys.status]: job.status,
  [JobSerialized.keys.pending]: job.status === jobStatus.pending,
  [JobSerialized.keys.running]: job.status === jobStatus.running,
  [JobSerialized.keys.succeeded]: job.status === jobStatus.succeeded,
  [JobSerialized.keys.canceled]: job.status === jobStatus.canceled,
  [JobSerialized.keys.failed]: job.status === jobStatus.failed,
  [JobSerialized.keys.ended]: job.isEnded(),

  // Progress
  [JobSerialized.keys.total]: job.total,
  [JobSerialized.keys.processed]: job.processed,
  [JobSerialized.keys.progressPercent]: calculateJobProgress(job),
  [JobSerialized.keys.elapsedMillis]: calculatedElapsedMillis(job),

  // Output
  [JobSerialized.keys.errors]: jobStatus.failed ? job.errors : null,
  [JobSerialized.keys.result]: jobStatus.succeeded ? job.result : null,
})
