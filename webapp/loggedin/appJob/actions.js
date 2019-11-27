import axios from 'axios'
import * as JobState from './appJobState'

export const appJobStart = 'app/job/start'
export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, onComplete = null, autoHide = false) => dispatch =>
  dispatch({type: appJobStart, job, onComplete, autoHide})

export const hideAppJobMonitor = () => dispatch => dispatch(activeJobUpdate(null))

export const cancelActiveJob = () => async dispatch => {
  await axios.delete('/api/jobs/active')
  dispatch(hideAppJobMonitor())
}

export const activeJobUpdate = job => (dispatch, getState) => {
  if (job && job.succeeded) {
    const onComplete = JobState.getActiveJobOnCompleteCallback(getState())
    if (onComplete) {
      onComplete(job)
    }
  }

  dispatch({type: appJobActiveUpdate, job})
}
