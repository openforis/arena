import axios from 'axios'

import { getActiveJob } from './appJobState'

import { isJobRunning } from '../../../../common/job/job'

export const appJobStart = 'app/job/start'
export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, onComplete = null, autoHide = false) => (dispatch) => {
  dispatch({type: appJobStart, job, onComplete, autoHide})
}

export const hideAppJobMonitor = () => async (dispatch) => {
  dispatch(activeJobUpdate(null))
}

export const cancelActiveJob = () => async (dispatch) => {
  await axios.delete(`/api/jobs/active`)
  //hide job monitor
  dispatch(hideAppJobMonitor())
}

export const activeJobUpdate = (job) =>
  ({type: appJobActiveUpdate, job})

/**
 * ======
 * Start / Stop Job polling
 * ======
 */

let activeJobPollingTimeout = null

export const startAppJobMonitoring = () => async (dispatch, getState) => {

  const fetchActiveJob = async () => {
    try {
      // job might be ended on server, but stateJob is still in UI

      const {data} = await axios.get(`/api/jobs/active`)

      const {job} = data
      // job still running on server
      const jobRunning = job !== null

      const stateJob = getActiveJob(getState())
      // job still in UI
      const stateJobExists = stateJob !== null

      if (jobRunning || stateJobExists) {

        if (!stateJobExists || jobRunning || stateJob.autoHide) {
          //job not monitored yet or completed and autoHide is true
          dispatch(activeJobUpdate(job))

          // job endeed on server, but running in UI and there's no autohide option,
        } else if (!jobRunning && isJobRunning(stateJob) && !stateJob.autoHide) {
          //job completed (no more active), load it
          const {data} = await axios.get(`/api/jobs/${stateJob.id}`)
          dispatch(activeJobUpdate(data.job))

          if (stateJob.onComplete) {
            stateJob.onComplete()
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







// Sockets

// export const updateJob = () => {
//   alert('updateJob')
// }
//
// export const startJobMonitoring = () => {
//   alert('startJobMonitoring')
// }
//
// // export const endJob = () => {
// //   alert('endJob')
// // }
//
// export const jobError = () => {
//   alert('jobError')
// }
