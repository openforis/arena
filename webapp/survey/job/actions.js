import axios from 'axios'
import { getSurvey } from '../surveyState'

export const surveyActiveJobUpdate = 'survey/current/job/update'

export const startSurveyJobMonitoring = job => async (dispatch) => {
  dispatch({type: surveyActiveJobUpdate, job})
}

export const fetchSurveyActiveJob = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const {data} = await axios.get(`/api/surveys/${survey.id}/jobs/active`)

  const job = data.job

  dispatch({type: surveyActiveJobUpdate, job})
}

export const cancelSurveyActiveJob = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  await axios.delete(`/api/surveys/${survey.id}/jobs/active`)

  closeSurveyActiveJobDialog()(dispatch)
}

export const closeSurveyActiveJobDialog = () => async (dispatch) => {
  dispatch({type: surveyActiveJobUpdate, job: null})
}