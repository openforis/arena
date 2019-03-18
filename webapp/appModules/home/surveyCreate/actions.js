import axios from 'axios'
import * as R from 'ramda'

import { surveyCreate, setActiveSurvey } from '../../../survey/actions'
import { showAppJobMonitor } from '../../appView/components/job/actions'

import * as SurveyCreateState from './surveyCreateState'

export const surveyCreateNewSurveyUpdate = 'surveyCreate/newSurvey/update'

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    SurveyCreateState.getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({ type: surveyCreateNewSurveyUpdate, newSurvey })

}
export const createSurvey = surveyProps => async (dispatch, getState) => {

  const { data } = await axios.post('/api/survey', surveyProps)

  const { survey } = data
  const valid = !!survey

  if (valid) {
    dispatch({ type: surveyCreate, survey })
  } else {
    dispatch({
      type: surveyCreateNewSurveyUpdate,
      newSurvey: {
        ...SurveyCreateState.getNewSurvey(getState()),
        ...data,
      }
    })
  }

}
export const importCollectSurvey = file =>
  async dispatch => {
    const formData = new FormData()
    formData.append('file', file)

    const config = { headers: { 'content-type': 'multipart/form-data' } }

    const { data } = await axios.post(`/api/survey/collect-import`, formData, config)

    dispatch(showAppJobMonitor(data.job, async (job) => {
      const surveyId = job.result.surveyId
      dispatch(setActiveSurvey(surveyId, false))

      const { data } = await axios.get(`/api/survey/${surveyId}/collect-import-report/count`)
      if (data.count > 0) {
        // TODO show CollectImportReportView
      }
    }))
  }