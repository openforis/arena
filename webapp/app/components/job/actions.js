import axios from 'axios'

import { getActiveJob } from './appJobState'

import { isJobRunning } from '../../../../common/job/job'

export const appJobStart = 'app/job/start'
export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, onComplete = null, autoHide = false) => (dispatch) => {
  dispatch({type: appJobStart, job, onComplete, autoHide})
}

export const hideAppJobMonitor = () => async (dispatch) => {
  dispatch({type: appJobActiveUpdate, job: null})
}

export const cancelActiveJob = () => async (dispatch) => {
  await axios.delete(`/api/jobs/active`)
  //hide job monitor
  dispatch(hideAppJobMonitor())
}

/**
 * ======
 * Start / Stop Job polling
 * ======
 */

let activeJobPollingTimeout = null

export const startAppJobMonitoring = () => async (dispatch, getState) => {

  const fetchActiveJob = async () => {
    try {
      const {data} = await axios.get(`/api/jobs/active`)

      const activeJob = data.job
      const activeJobState = getActiveJob(getState())

      if (activeJob !== null || activeJobState !== null) {
        if (activeJobState === null || activeJob || activeJobState.autoHide) {
          //job not monitored yet or completed and autoHide is true
          dispatch({type: appJobActiveUpdate, job: activeJob})
        } else if (activeJob === null && isJobRunning(activeJobState) && !activeJobState.autoHide) {
          //job completed (no more active), load it
          const {data} = await axios.get(`/api/jobs/${activeJobState.id}`)
          dispatch({type: appJobActiveUpdate, job: data.job})

          if (activeJobState.onComplete) {
            activeJobState.onComplete()
          }
        }
      }
    } catch (e) {}
    activeJobPollingTimeout = setTimeout(fetchActiveJob, 3000)
  }

  await fetchActiveJob()
}

export const stopAppJobMonitoring = () => () => {
  clearTimeout(activeJobPollingTimeout)
  activeJobPollingTimeout = null
}
