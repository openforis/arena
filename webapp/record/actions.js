import axios from 'axios'

import { commandType } from '../../common/record/record'
import { getSurveyState, getCurrentSurveyId, getRecord } from '../survey/surveyState'

export const recordCreated = 'record/created'
export const recordUpdated = 'record/updated'
export const nodeDeleted = 'record/nodeDeleted'

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

export const updateRecord = (command) => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const record = getRecord(getSurveyState(getState()))

    const {data} = await axios.put(`/api/survey/${surveyId}/record/${record.id}/node/${command.nodeId}`, {command})
    const {updatedNodes} = data

    if (command.type === commandType.deleteNode) {
      dispatch({type: nodeDeleted, updatedNodes})
    } else {
      dispatch({type: recordUpdated, updatedNodes})
    }
  } catch (e) {
    console.log(e)
  }
}