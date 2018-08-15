import axios from 'axios'

import { getCurrentSurveyId } from '../survey/surveyState'

export const recordCreated = 'record/created'

export const createRecord = () => async (dispatch, getState) => {
  const surveyId = getCurrentSurveyId(getState())

  try {
    const {data} = await axios.post(`/api/record`, {surveyId})
    const {record} = data

    dispatch({type: recordCreated, record})
  } catch (e) {}
}