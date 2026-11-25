import * as JobSerialized from '@common/job/jobSerialized'
import * as A from '@core/arena'

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

// the job is a Job instance: its progress fields are protected or not declared
type AnyJob = any // NOSONAR

const calculatePartialProgress = (job: AnyJob): number => {
  const { processed, status, total } = job
  if (status === jobStatus.succeeded) {
    return 100
  }
  if (total > 0) {
    return Math.floor((100 * processed) / total)
  }
  return 0
}

const calculateJobProgress = (job: AnyJob): number => {
  const { currentInnerJobIndex, innerJobs, processed, total } = job
  const partialProgress = calculatePartialProgress(job)
  if (
    innerJobs.length === 0 ||
    currentInnerJobIndex < 0 ||
    partialProgress === 100 ||
    processed > currentInnerJobIndex
  ) {
    return partialProgress
  }
  const currentInnerJobProgress = calculateJobProgress(job.getCurrentInnerJob())
  return partialProgress + Math.floor(currentInnerJobProgress / total)
}

const calculatedElapsedMillis = (job: AnyJob): number =>
  job.startTime ? (job.endTime ?? new Date()).getTime() - job.startTime.getTime() : 0

export const jobToJSON = (job: AnyJob): Record<string, any> => ({
  [JobSerialized.keys.uuid]: job.uuid,
  [JobSerialized.keys.type]: job.type,
  [JobSerialized.keys.userUuid]: job.userUuid,
  [JobSerialized.keys.surveyId]: job.surveyId,

  [JobSerialized.keys.innerJobs]: job.innerJobs.map(jobToJSON),
  [JobSerialized.keys.currentInnerJobIndex]: job.currentInnerJobIndex,

  // Status
  [JobSerialized.keys.status]: job.status,
  [JobSerialized.keys.pending]: job.status === jobStatus.pending,
  [JobSerialized.keys.running]: job.status === jobStatus.running,
  [JobSerialized.keys.succeeded]: job.status === jobStatus.succeeded,
  [JobSerialized.keys.canceled]: job.status === jobStatus.canceled,
  [JobSerialized.keys.canceledByAdmin]: !!job.canceledByAdmin,
  [JobSerialized.keys.failed]: job.status === jobStatus.failed,
  [JobSerialized.keys.ended]: job.isEnded(),

  // Progress
  [JobSerialized.keys.total]: job.total,
  [JobSerialized.keys.processed]: job.processed,
  [JobSerialized.keys.progressPercent]: calculateJobProgress(job),
  [JobSerialized.keys.elapsedMillis]: calculatedElapsedMillis(job),

  // Output
  // errors sent even if the job succeeded (e.g. data import validation completed with errors)
  [JobSerialized.keys.errors]: A.isEmpty(job.errors) ? null : job.errors,
  [JobSerialized.keys.result]: job.status === jobStatus.succeeded ? job.result : null,
})

export const jobRowToSummary = (jobRow: Record<string, any>): Record<string, any> => {
  const { uuid, userUuid, surveyId, type, status, processed, total, props, dateCreated, dateModified } = jobRow
  const ended = [jobStatus.succeeded, jobStatus.failed, jobStatus.canceled].includes(status)
  const baseProgressPercent = total > 0 ? Math.floor((100 * processed) / total) : 0
  const progressPercent = status === jobStatus.succeeded ? 100 : baseProgressPercent
  const elapsedMillis = (ended ? new Date(dateModified) : new Date()).getTime() - new Date(dateCreated).getTime()

  return {
    [JobSerialized.keys.uuid]: uuid,
    [JobSerialized.keys.type]: type,
    [JobSerialized.keys.userUuid]: userUuid,
    [JobSerialized.keys.surveyId]: surveyId,
    [JobSerialized.keys.innerJobs]: [],
    [JobSerialized.keys.currentInnerJobIndex]: -1,
    [JobSerialized.keys.status]: status,
    [JobSerialized.keys.pending]: status === jobStatus.pending,
    [JobSerialized.keys.running]: status === jobStatus.running,
    [JobSerialized.keys.succeeded]: status === jobStatus.succeeded,
    [JobSerialized.keys.canceled]: status === jobStatus.canceled,
    [JobSerialized.keys.failed]: status === jobStatus.failed,
    [JobSerialized.keys.ended]: ended,
    [JobSerialized.keys.total]: total,
    [JobSerialized.keys.processed]: processed,
    [JobSerialized.keys.progressPercent]: progressPercent,
    [JobSerialized.keys.elapsedMillis]: elapsedMillis,
    [JobSerialized.keys.errors]: props?.errors ?? null,
    [JobSerialized.keys.result]: props?.result ?? null,
  }
}

export const jobRowToMonitorSummary = (jobRow: Record<string, any>): Record<string, any> => {
  const { dateCreated, userName, userEmail, surveyName } = jobRow
  return {
    ...jobRowToSummary(jobRow),
    dateCreated,
    userName,
    userEmail,
    surveyName,
  }
}
