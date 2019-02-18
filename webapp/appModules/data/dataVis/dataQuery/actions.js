import axios from 'axios'
import Promise from 'bluebird'
import * as R from 'ramda'

import * as SurveyState from '../../../../survey/surveyState'
import * as DataQueryState from './dataQueryState'
import NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'

export const dataQueryTableNodeDefUuidUpdate = 'dataQuery/table/nodeDefUuid/update'
export const dataQueryTableNodeDefUuidColsUpdate = 'dataQuery/table/nodeDefUuidCols/update'
export const dataQueryTableInit = 'dataQuery/table/init'
export const dataQueryTableDataUpdate = 'dataQuery/table/data/update'
export const dataQueryTableDataColUpdate = 'dataQuery/table/data/col/update'
export const dataQueryTableDataColDelete = 'dataQuery/table/data/col/delete'
export const dataQueryTableFilterUpdate = 'dataQuery/table/filter/update'

const defaults = {
  offset: 0,
  limit: 15,
  filter: '',
}

const getTableName = (state, nodeDefUuidTable) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getViewNameByUuid(nodeDefUuidTable)(survey)
}

const getColNames = (state, nodeDefUuidCols) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
}

const queryTable = (surveyId, tableName, cols, offset = 0, filter = '') => axios.get(
  `/api/surveyRdb/${surveyId}/${tableName}/query?cols=${JSON.stringify(cols)}&offset=${offset}&limit=${defaults.limit}&filter=${filter}`,
  // {params: {cols: JSON.stringify(cols), offset, limit}}
)

const fetchData = async (state, cols = null, offset = null, filter = null) => {
  if (DataQueryState.hasTableAndCols(state)) {
    const surveyId = SurveyState.getStateSurveyId(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const nodeDefUuidCols = R.isNil(cols) ? DataQueryState.getTableNodeDefUuidCols(state) : cols
    const tableName = getTableName(state, nodeDefUuidTable)
    const colsParam = getColNames(state, nodeDefUuidCols)
    const offsetParam = R.isNil(offset) ? DataQueryState.getTableOffset(state) : offset
    const filterParam = R.isNil(filter) ? DataQueryState.getTableFilter(state) : filter

    const { data } = await queryTable(surveyId, tableName, colsParam, offsetParam, filterParam)
    return data
  }
}

export const updateTableNodeDefUuid = nodeDefUuidTable => dispatch => {
  dispatch({ type: dataQueryTableNodeDefUuidUpdate, nodeDefUuidTable })
  dispatch({
    type: dataQueryTableDataUpdate,
    offset: defaults.offset,
    data: [],
  })
}

export const updateTableNodeDefUuidCols = (nodeDefUuidCols, nodeDefUuidCol = null, nodeDefUuidColDeleted = false) =>
  async (dispatch, getState) => {
    const state = getState()

    dispatch({ type: dataQueryTableNodeDefUuidColsUpdate, nodeDefUuidCols })

    const fetch = !R.isEmpty(nodeDefUuidCols) &&
      !!nodeDefUuidCol &&
      !nodeDefUuidColDeleted

    if (fetch) {
      const hasTableAndCols = DataQueryState.hasTableAndCols(state)
      if (hasTableAndCols) {
        const state = getState()
        const data = await fetchData(state, [nodeDefUuidCol])
        dispatch({ type: dataQueryTableDataColUpdate, data })
      } else {
        dispatch(initTableData(DataQueryState.getTableFilter(state)))
      }
    } else if (nodeDefUuidColDeleted) {
      // reset data
      if (R.isEmpty(nodeDefUuidCols))
        dispatch({ type: dataQueryTableDataUpdate, offset: 0, data: [], })
      // delete cols from data rows
      else
        dispatch({ type: dataQueryTableDataColDelete, cols: getColNames(state, [nodeDefUuidCol]) })
    }

  }

export const initTableData = (queryFilter = null) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getStateSurveyId(state)

    if (DataQueryState.hasTableAndCols(state)) {

      const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
      const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
      const filter = R.isNil(queryFilter) ? DataQueryState.getTableFilter(state) : queryFilter
      const tableName = getTableName(state, nodeDefUuidTable)
      const cols = getColNames(state, nodeDefUuidCols)

      const { offset, limit } = defaults

      const [countResp, dataResp] = await Promise.all([
        axios.get(`/api/surveyRdb/${surveyId}/${tableName}/query/count?filter=${filter}`),
        queryTable(surveyId, tableName, cols, offset, filter)
      ])

      dispatch({
        type: dataQueryTableInit,
        offset,
        limit,
        filter,
        count: countResp.data.count,
        data: dataResp.data,
        nodeDefUuidTable,
        nodeDefUuidCols,
      })
    }
  }

export const updateTableOffset = (offset = 0) =>
  async (dispatch, getState) => {
    const data = await fetchData(getState(), null, offset)
    dispatch({ type: dataQueryTableDataUpdate, offset, data })
  }

export const updateTableFilter = (filter) => dispatch =>
  dispatch(initTableData(filter))