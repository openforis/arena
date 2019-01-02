import axios from 'axios'
import Promise from 'bluebird'

import * as DataVisState from './dataVisState'

import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'
import * as SurveyState from '../../../survey/surveyState'

export const dataVisTableInit = 'data/dataVis/table/init'
export const dataVisTableUpdate = 'data/dataVis/table/update'
export const dataVisTableReset = 'data/dataVis/table/reset'

const limit = 15

const queryTable = (surveyId, tableName, cols, offset = 0) => axios.get(
  `/api/surveyRdb/${surveyId}/${tableName}/query?cols=${JSON.stringify(cols)}&offset=${offset}&limit=${limit}`,
  // {params: {cols: JSON.stringify(cols), offset, limit}}
)

const getTableName = (state, nodeDefUuidTable) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getViewNameByUuid(nodeDefUuidTable)(survey)
}

const getColNames = (state, nodeDefUuidCols) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
}

export const initDataTable = (nodeDefUuidTable, nodeDefUuidCols) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getStateSurveyId(state)

  const tableName = getTableName(state, nodeDefUuidTable)
  const cols = getColNames(state, nodeDefUuidCols)

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
    data: dataResp.data,
    nodeDefUuidTable,
    nodeDefUuidCols,
  })
}

export const updateDataTable = (offset = 0) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getStateSurveyId(state)

  const tableName = getTableName(state, DataVisState.getTableNodeDefUuidTable(state))
  const cols = getColNames(state, DataVisState.getTableNodeDefUuidCols(state))

  const {data} = await queryTable(surveyId, tableName, cols, offset)

  dispatch({
    type: dataVisTableUpdate,
    offset,
    data,
  })

}

export const resetDataTable = () => dispatch =>
  dispatch({type: dataVisTableReset})
