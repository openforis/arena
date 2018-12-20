import axios from 'axios'
import Promise from 'bluebird'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import * as SurveyState from '../../../survey/surveyState'

export const dataVisListInit = 'data/dataVis/list/init'
export const dataVisListUpdate = 'data/dataVis/list/update'

const limit = 15


const queryTable = (surveyId, tableName, cols, offset = 0) => axios.get(
  `/api/surveyRdb/${surveyId}/${tableName}/count`,
  {params: {offset, limit}}
)

export const initDataTable = (nodeDefUuidTable, nodeDefUuidCols) => async (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const surveyId = SurveyState.getStateSurveyId(state)

  //TODO add surveyRdb meta to common folder
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const tableName = 'data_' + NodeDef.getNodeDefName(nodeDefTable)

  const offset = 0

  // console.log(nodeDefUuidCols)

  const [countResp, dataResp] = await Promise.all([
    axios.get(`/api/surveyRdb/${surveyId}/${tableName}/count`),
    queryTable(surveyId, tableName, offset)
  ])

  dispatch({
    type: dataVisListInit,
    offset,
    limit,
    count: countResp.data.count,
    // data: dataResp.data.records,
  })
}

