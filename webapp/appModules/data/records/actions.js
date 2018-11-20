import axios from 'axios'
import Promise from 'bluebird'

import { getStateSurveyId } from '../../../survey/surveyState'

export const recordsListInit = 'data/records/list/init'

const limit = 15

const getRecords = (surveyId, offset = 0) => axios.get(`/api/survey/${surveyId}/records`, {
  params: {
    offset,
    limit
  }
})

export const initRecordsList = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const offset = 0

  const [countResp, recordsResp] = await Promise.all([
    axios.get(`/api/survey/${surveyId}/records/count`),
    getRecords(surveyId, offset)
  ])

  dispatch({
    type: recordsListInit,
    offset,
    limit,
    count: countResp.data.count,
    list: recordsResp.data.records,
  })
}