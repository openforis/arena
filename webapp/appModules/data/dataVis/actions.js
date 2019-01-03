import axios from 'axios'
import Promise from 'bluebird'

import * as DataVisState from './dataVisState'

import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'
import * as SurveyState from '../../../survey/surveyState'

export const dataVisTableInit = 'data/dataVis/table/init'
export const dataVisTableUpdate = 'data/dataVis/table/update'
export const dataVisTableFilterUpdate = 'data/dataVis/tableFilter/update'
export const dataVisTableReset = 'data/dataVis/table/reset'

const defaults = {
  offset: 0,
  limit: 15,
  filter: '',
}

const limit = 15

const queryTable = (surveyId, tableName, cols, offset = 0, filter = '') => axios.get(
  `/api/surveyRdb/${surveyId}/${tableName}/query?cols=${JSON.stringify(cols)}&offset=${offset}&limit=${limit}&filter=${filter}`,
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

export const initDataTable = (nodeDefUuidTable, nodeDefUuidCols, filter = defaults.filter) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getStateSurveyId(state)

    const tableName = getTableName(state, nodeDefUuidTable)
    const cols = getColNames(state, nodeDefUuidCols)

    const {offset, limit} = defaults

    const [countResp, dataResp] = await Promise.all([
      axios.get(`/api/surveyRdb/${surveyId}/${tableName}/query/count?filter=${filter}`),
      queryTable(surveyId, tableName, cols, offset, filter)
    ])

    dispatch({
      type: dataVisTableInit,
      offset,
      limit,
      filter,
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
  const filter = DataVisState.getTableFilter(state)

  const {data} = await queryTable(surveyId, tableName, cols, offset, filter)

  dispatch({
    type: dataVisTableUpdate,
    offset,
    data,
  })

}

export const resetDataTable = () => dispatch =>
  dispatch({type: dataVisTableReset})

export const updateDataFilter = (filter = '') => async (dispatch, getState) => {
  dispatch({type: dataVisTableFilterUpdate, filter})

  const state = getState()
  const nodeDefUuidTable = DataVisState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataVisState.getTableNodeDefUuidCols(state)
  dispatch(initDataTable(nodeDefUuidTable, nodeDefUuidCols, filter))
}