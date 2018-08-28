import axios from 'axios'

import { getCurrentSurvey } from '../surveyState'
import { getSurveyDefaultStep } from '../../../common/survey/survey'
import { appState } from '../../app/app'

import { newRecord } from '../../../common/record/record'

export const recordUpdate = 'survey/record/update'

export const nodeDeleted = 'record/nodeDeleted'

export const createRecord = () => async (dispatch, getState) => {
  try {
    const state = getState()

    const user = appState.getUser(state)
    const survey = getCurrentSurvey(state)
    const step = getSurveyDefaultStep(survey)

    const record = newRecord(user, survey.id, step)
    dispatch({type: recordUpdate, record})

    const {data} = await axios.post(`/api/survey/${survey.id}/record`, record)
    dispatch({type: recordUpdate, record: data.record})

  } catch (e) {
    console.log(e)
  }
}

export const updateRecord = (command) => async (dispatch, getState) => {
  // try {
  //   const surveyId = getCurrentSurveyId(getState())
  //   const record = getRecord(getSurveyState(getState()))
  //
  //   const {data} = await axios.put(`/api/survey/${surveyId}/record/${record.id}/node/${command.nodeId}`, {command})
  //   const {updatedNodes} = data
  //
  //   if (command.type === commandType.deleteNode) {
  //     dispatch({type: nodeDeleted, updatedNodes})
  //   } else {
  //     dispatch({type: recordUpdated, updatedNodes})
  //   }
// }
// catch
// (e)
// {
//   console.log(e)
// }
}