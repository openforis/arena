import axios from 'axios'

import {getCurrentSurveyId} from '../survey/surveyState'

export const recordCreated = 'record/created'
export const recordUpdated = 'record/updated'

export const createRecord = () => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const {data} = await axios.post(`/api/survey/${surveyId}/record`)
    const {record} = data

    dispatch({type: recordCreated, record})
  } catch (e) {
    console.log(e)
  }
}

export const updateRecordNode = (nodeDefId, parentNodeId, nodeId, value) => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())

    const {data} = await axios.post(`/api/survey/${surveyId}/record/update`, {
      nodeDefId,
      parentNodeId,
      nodeId,
      value
    })
    const {events} = data
    dispatch({type: recordUpdated, events})
  } catch (e) {
    console.log(e)
  }
}