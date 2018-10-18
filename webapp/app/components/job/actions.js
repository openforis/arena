import axios from 'axios'

import { getSurvey } from '../../../survey/surveyState'

export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = job => async (dispatch) => {
  dispatch({type: appJobActiveUpdate, job})
}

export const hideAppJobMonitor = () => async (dispatch) => {
  dispatch({type: appJobActiveUpdate, job: null})
}

export const cancelActiveJob = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  await axios.delete(`/api/surveys/${survey.id}/jobs/active`)

  dispatch(hideAppJobMonitor())
}

/**
 * ======
 * Start / Stop Job polling
 * ======
 */

let activeJobPollingInterval = null

export const startAppJobMonitoring = () => (dispatch, getState) => {

  const fetchActiveJob = async () => {
    const survey = getSurvey(getState())

    const {data} = await axios.get(`/api/surveys/${survey.id}/jobs/active`)

    dispatch({type: appJobActiveUpdate, job: data.job})
  }

  activeJobPollingInterval = setInterval(fetchActiveJob, 3000)
}

export const stopAppJobMonitoring = () => () => {
  clearInterval(activeJobPollingInterval)
  activeJobPollingInterval = null
}
