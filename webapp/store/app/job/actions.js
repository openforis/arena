import axios from 'axios'

import * as JobSerialized from '@common/job/jobSerialized'

import * as JobState from './state'

export const JOB_START = 'app/job/start'
export const JOB_UPDATE = 'app/job/update'

export const showJobMonitor =
  ({ job, onComplete = null, autoHide = false, closeButton = null }) =>
  (dispatch) =>
    dispatch({ type: JOB_START, job, onComplete, autoHide, closeButton })

export const updateJob =
  ({ job, hasToRefresh = false }) =>
  (dispatch, getState) => {
    dispatch({ type: JOB_UPDATE, job })

    if (JobSerialized.isSucceeded(job)) {
      const onComplete = JobState.getOnComplete(getState())
      if (onComplete) {
        onComplete(job)
      }
      if (JobState.isAutoHide(getState())) {
        dispatch({ type: JOB_UPDATE, job: null })
      }
    }
    if (hasToRefresh) {
      window?.location.reload()
    }
  }

export const hideJobMonitor = () => updateJob({ job: null, hasToRefresh: true })

export const cancelJob = () => async (dispatch) => {
  await axios.delete('/api/jobs/active')
  dispatch(hideJobMonitor())
}
