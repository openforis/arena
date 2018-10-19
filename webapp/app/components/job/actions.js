import axios from 'axios'

import { getActiveJob } from './appJobState'

import { isJobCompleted, isJobRunning } from '../../../../common/job/job'

export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, hideAutomatically = false) => (dispatch) => {
  dispatch({type: appJobActiveUpdate, job, hideAutomatically})
}

export const hideAppJobMonitor = () => async (dispatch) => {
  dispatch({type: appJobActiveUpdate, job: null})
}

export const cancelActiveJob = () => async (dispatch) => {
  await axios.delete(`/api/jobs/active`)

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
    const {data} = await axios.get(`/api/jobs/active`)

    const activeJob = data.job
    const activeJobState = getActiveJob(getState())

    if (activeJob !== null || activeJobState !== null) {
      if (activeJobState === null || activeJob || activeJobState.hideAutomatically) {
        //job not monitored yet or completed and hideAutomatically is true
        dispatch({type: appJobActiveUpdate, job: activeJob})
      } else if (activeJob === null && isJobRunning(activeJobState) && !activeJobState.hideAutomatically) {
        //job completed (no more active), load it
        const {data} = await axios.get(`/api/jobs/${activeJobState.id}`)
        dispatch({type: appJobActiveUpdate, job: data.job})
      }
    }
    activeJobPollingTimeout = setTimeout(fetchActiveJob, 3000)
  }

  await fetchActiveJob()
}

export const stopAppJobMonitoring = () => () => {
  clearTimeout(activeJobPollingTimeout)
  activeJobPollingTimeout = null
}
