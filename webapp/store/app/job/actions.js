import axios from 'axios'

import * as JobSerialized from '@common/job/jobSerialized'

import * as JobState from './state'

export const JOB_START = 'app/job/start'
export const JOB_UPDATE = 'app/job/update'

export const showJobMonitor =
  ({
    job,
    onComplete = null,
    onFail = null,
    autoHide = false,
    closeButton = null,
    closeButtonProps = null,
    errorKeyHeaderName = undefined,
    errorsExportFileName = undefined,
    longRunningMessageKey = undefined,
  }) =>
  (dispatch) =>
    dispatch({
      type: JOB_START,
      job,
      onComplete,
      onFail,
      autoHide,
      closeButton,
      closeButtonProps,
      errorKeyHeaderName,
      errorsExportFileName,
      longRunningMessageKey,
    })

export const updateJob =
  ({ job }) =>
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
    } else if (JobSerialized.isFailed(job)) {
      const onFail = JobState.getOnFail(getState())
      if (onFail) {
        onFail(job)
      }
    }
  }

export const hideJobMonitor = () => updateJob({ job: null })

export const cancelJob = () => async (dispatch) => {
  await axios.delete('/api/jobs/active')
  dispatch(hideJobMonitor())
}
