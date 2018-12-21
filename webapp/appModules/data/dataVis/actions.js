import axios from 'axios'
import Promise from 'bluebird'

import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'
import * as SurveyState from '../../../survey/surveyState'

export const dataVisTableInit = 'data/dataVis/table/init'
export const dataVisTableUpdate = 'data/dataVis/table/update'

const limit = 15

const queryTable = (surveyId, tableName, cols, offset = 0) => axios.get(
  `/api/surveyRdb/${surveyId}/${tableName}/query?cols=${JSON.stringify(cols)}&offset=${offset}&limit=${limit}`,
  // {params: {cols: JSON.stringify(cols), offset, limit}}
)

export const initDataTable = (nodeDefUuidTable, nodeDefUuidCols) => async (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const surveyId = SurveyState.getStateSurveyId(state)

  const tableName = NodeDefTable.getViewName(nodeDefUuidTable)(survey)
  const cols = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)

  const offset = 0

  const [countResp, dataResp] = await Promise.all([
    axios.get(`/api/surveyRdb/${surveyId}/${tableName}/query/count`),
    queryTable(surveyId, tableName, cols, offset)
  ])

  dispatch({
    type: dataVisTableInit,
    offset,
    limit,
    count: countResp.data.count,
    // data: dataResp.data.records,
  })
}

