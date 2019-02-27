import axios from 'axios'
import * as R from 'ramda'

import { surveyCreate } from '../../survey/actions'
import { getNewSurvey } from './appHomeState'
import { getStateSurveyId } from '../../survey/surveyState'
import { showAppJobMonitor } from '../appView/components/job/actions'

export const homeNewSurveyUpdate = 'home/newSurvey/update'
export const homeSurveysUpdate = 'home/surveys/update'

// ====== New Survey

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({type: homeNewSurveyUpdate, newSurvey})

}

export const createSurvey = surveyProps => async (dispatch, getState) => {

  const {data} = await axios.post('/api/survey', surveyProps)

  const {survey} = data
  const valid = !!survey

  if (valid) {
    dispatch({type: surveyCreate, survey})
  } else {
    dispatch({
      type: homeNewSurveyUpdate,
      newSurvey: {
        ...getNewSurvey(getState()),
        ...data,
      }
    })
  }

}

export const importCollectSurveyFile = file => async (dispatch) => {
  const formData = new FormData()
  formData.append('file', file)

  const config = {
    headers: {
      'content-type': 'multipart/form-data'
    }
  }

  const {data} = await axios.post(`/api/survey/import-from-collect`, formData, config)
}

// ====== SURVEYS LIST

export const fetchSurveys = () => async dispatch => {
  try {
    const {data} = await axios.get('/api/surveys')

    dispatch({type: homeSurveysUpdate, surveys: data.surveys})
  } catch (e) {
  }
}