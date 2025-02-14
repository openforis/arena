import * as User from '@core/user/user'

import * as JobQueue from './jobQueue'
import * as JobThreadExecutor from './jobThreadExecutor'

export const getActiveJobSummary = JobQueue.getActiveJobByUserUuid

export const cancelActiveJobByUserUuid = JobQueue.cancelActiveJobByUserUuid

export const enqueueJob = async (job) => {
  if (JobQueue.enabled) {
    await JobQueue.enqueue(job)
  } else {
    JobThreadExecutor.executeJobThread(job)
  }
  return job
}

const canCancelJob = ({ user, jobSummary }) =>
  jobSummary && (User.isSystemAdmin(user) || User.getUuid(user) === User.getUuid(jobSummary.user))

export const cancelJob = async ({ user, jobUuid }) => {
  if (JobQueue.enabled) {
    const jobSummary = await JobQueue.getJobSummary({ jobUuid })
    if (!canCancelJob({ jobSummary, user })) {
      return false
    }
    await JobQueue.cancelJob(jobUuid)
  } else {
    const jobSummary = JobThreadExecutor.getActiveJobSummaryByUuid(jobUuid)
    if (jobSummary) {
      JobThreadExecutor.cancelActiveJobByUserUuid(jobSummary.userUuid)
    }
  }
}
