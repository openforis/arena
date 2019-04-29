import axios from 'axios'
import Promise from 'bluebird'
import * as R from 'ramda'

import * as SurveyState from '../../../../../survey/surveyState'
import * as DataQueryState from './dataQueryState'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

import * as DataSort from './components/sort/dataSort'

export const dataQueryTableNodeDefUuidUpdate = 'dataQuery/table/nodeDefUuid/update'
export const dataQueryTableNodeDefUuidColsUpdate = 'dataQuery/table/nodeDefUuidCols/update'
export const dataQueryTableInit = 'dataQuery/table/init'
export const dataQueryTableDataUpdate = 'dataQuery/table/data/update'
export const dataQueryTableDataColUpdate = 'dataQuery/table/data/col/update'
export const dataQueryTableDataColDelete = 'dataQuery/table/data/col/delete'
export const dataQueryTableFilterUpdate = 'dataQuery/table/filter/update'
export const dataQueryTableSortUpdate = 'dataQuery/table/sort/update'

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

const queryTable = (surveyId, editMode, nodeDefUuidTable, tableName, nodeDefUuidCols, cols, offset = 0, filter = '', sort = '') =>
  axios.get(
    `/api/surveyRdb/${surveyId}/${tableName}/query`, {
      params: {
        nodeDefUuidTable,
        cols: JSON.stringify(cols),
        nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
        offset,
        limit: defaults.limit,
        filter,
        sort: DataSort.serialize(sort),
        editMode
      }
    }
  )

const fetchData = async (state, nodeDefUuidCols = null, offset = null, filter = null, sort = null) => {
  if (DataQueryState.hasTableAndCols(state)) {
    const surveyId = SurveyState.getSurveyId(state)
    const editMode = DataQueryState.getTableEditMode(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const nodeDefUuidColsParam = R.defaultTo(DataQueryState.getTableNodeDefUuidCols(state), nodeDefUuidCols)
    const tableName = getTableName(state, nodeDefUuidTable)
    const colsParam = getColNames(state, nodeDefUuidColsParam)
    const offsetParam = R.defaultTo(DataQueryState.getTableOffset(state), offset)
    const filterParam = R.defaultTo(DataQueryState.getTableFilter(state), filter)
    const sortParam = R.defaultTo(DataQueryState.getTableSort(state), sort)
    const { data } = await queryTable(surveyId, editMode, nodeDefUuidTable, tableName, nodeDefUuidColsParam, colsParam, offsetParam, filterParam, sortParam)
    return data
  }
}

export const updateTableNodeDefUuid = nodeDefUuidTable => dispatch => {
  dispatch({ type: dataQueryTableNodeDefUuidUpdate, nodeDefUuidTable })
  dispatch({
    type: dataQueryTableDataUpdate,
    offset: defaults.offset,
    data: []
  })
}

export const updateTableNodeDefUuidCols = (nodeDefUuidCols, nodeDefUuidCol = null, nodeDefUuidColDeleted = false) =>
  async (dispatch, getState) => {
    const state = getState()

    dispatch({ type: dataQueryTableNodeDefUuidColsUpdate, nodeDefUuidCols })

    const newSort = DataSort.deleteVariablesByNames(DataQueryState.getTableSort(state), getColNames(state, nodeDefUuidCols))
    dispatch({ type: dataQueryTableSortUpdate, sort: newSort })

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
        dispatch({ type: dataQueryTableDataUpdate, offset: 0, data: [] })
      // delete cols from data rows
      else
        dispatch({ type: dataQueryTableDataColDelete, cols: getColNames(state, [nodeDefUuidCol]) })
    }

  }

export const initTableData = (queryFilter = null, querySort = null, editModeParam = null) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    if (DataQueryState.hasTableAndCols(state)) {

      const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
      const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
      const filter = R.defaultTo(DataQueryState.getTableFilter(state), queryFilter)
      const sort = R.defaultTo(DataQueryState.getTableSort(state), querySort)
      const editMode = R.defaultTo(DataQueryState.getTableEditMode(state), editModeParam)
      const tableName = getTableName(state, nodeDefUuidTable)
      const cols = getColNames(state, nodeDefUuidCols)

      const { offset, limit } = defaults

      const [countResp, dataResp] = await Promise.all([
        axios.get(`/api/surveyRdb/${surveyId}/${tableName}/query/count?filter=${filter}`),
        queryTable(surveyId, editMode, nodeDefUuidTable, tableName, nodeDefUuidCols, cols, offset, filter, sort)
      ])

      dispatch({
        type: dataQueryTableInit,
        offset,
        limit,
        filter,
        sort,
        count: countResp.data.count,
        data: dataResp.data,
        nodeDefUuidTable,
        nodeDefUuidCols,
        editMode
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

export const updateTableSort = (sort) => dispatch =>
  dispatch(initTableData(null, sort))

export const updateTableEditMode = editMode => dispatch =>
  dispatch(initTableData(null, null, editMode))