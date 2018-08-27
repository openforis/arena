import axios from 'axios'

import { getCurrentSurveyId } from '../survey/surveyState'
import { getGlobalCurrentRecordId } from './recordState'

export const recordCreated = 'record/created'
export const recordUpdated = 'record/updated'

export const createRecord = () => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const {data} = await axios.post(`/api/survey/${surveyId}/record`)
    const {events} = data
    dispatch({type: recordUpdated, events})
  } catch (e) {
    console.log(e)
  }
}

export const updateRecord = (command) => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const recordId = getGlobalCurrentRecordId(getState())

    const {data} = await axios.put(`/api/survey/${surveyId}/record/${recordId}/node/${command.nodeId}`, {command})
    const {events} = data
    dispatch({type: recordUpdated, events})
  } catch (e) {
    console.log(e)
  }
}