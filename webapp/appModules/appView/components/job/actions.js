import axios from 'axios'

import { getActiveJob, getActiveJobOnCompleteCallback } from './appJobState'

export const appJobStart = 'app/job/start'
export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, onComplete = null, autoHide = false) => (dispatch) =>
  dispatch({type: appJobStart, job, onComplete, autoHide})

export const hideAppJobMonitor = () => dispatch => dispatch(activeJobUpdate(null))

export const cancelActiveJob = () => async (dispatch) => {
  await axios.delete(`/api/jobs/active`)
  //hide job monitor
  dispatch(hideAppJobMonitor())
}

export const activeJobUpdate = job =>
  (dispatch, getState) => {
    if (job && job.succeeded) {
      const stateJob = getActiveJob(getState())
      const onComplete = getActiveJobOnCompleteCallback(stateJob)
      if (stateJob && onComplete) {
        onComplete(job)
      }
    }
    dispatch({type: appJobActiveUpdate, job})
  }

