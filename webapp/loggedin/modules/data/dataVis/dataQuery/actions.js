import axios from 'axios'
import * as R from 'ramda'

import * as SurveyState from '../../../../../survey/surveyState'
import * as DataQueryState from './dataQueryState'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

import * as DataSort from '../../../../../../common/surveyRdb/dataSort'

// ====== table
export const dataQueryTableNodeDefUuidUpdate = 'dataQuery/table/nodeDefUuid/update'
export const dataQueryTableNodeDefUuidColsUpdate = 'dataQuery/table/nodeDefUuidCols/update'
export const dataQueryTableInit = 'dataQuery/table/init'
export const dataQueryTableDataUpdate = 'dataQuery/table/data/update'
export const dataQueryTableDataColUpdate = 'dataQuery/table/data/col/update'
export const dataQueryTableDataColDelete = 'dataQuery/table/data/col/delete'
export const dataQueryTableFilterUpdate = 'dataQuery/table/filter/update'
export const dataQueryTableSortUpdate = 'dataQuery/table/sort/update'

const getTableName = (state, nodeDefUuidTable) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getViewNameByUuid(nodeDefUuidTable)(survey)
}

const getColNames = (state, nodeDefUuidCols) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
}

const queryTable = (surveyId, cycle, editMode, nodeDefUuidTable, tableName, nodeDefUuidCols, cols, offset = 0, filter = null, sort = null) =>
  axios.post(
    `/api/surveyRdb/${surveyId}/${tableName}/query`, {
      cycle,
      nodeDefUuidTable,
      cols: JSON.stringify(cols),
      nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
      offset,
      limit: DataQueryState.defaults.limit,
      filter: filter ? JSON.stringify(filter) : null,
      sort: DataSort.toHttpParams(sort),
      editMode,
    }
  )

const fetchData = async (state, nodeDefUuidCols = null, offset = null, filter = null, sort = null) => {
  if (DataQueryState.hasTableAndCols(state)) {
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    const editMode = DataQueryState.getTableEditMode(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const nodeDefUuidColsParam = R.defaultTo(DataQueryState.getTableNodeDefUuidCols(state), nodeDefUuidCols)
    const tableName = getTableName(state, nodeDefUuidTable)
    const colsParam = getColNames(state, nodeDefUuidColsParam)
    const offsetParam = R.defaultTo(DataQueryState.getTableOffset(state), offset)
    const filterParam = R.defaultTo(DataQueryState.getTableFilter(state), filter)
    const sortParam = R.defaultTo(DataQueryState.getTableSort(state), sort)
    const { data } = await queryTable(surveyId, cycle, editMode, nodeDefUuidTable, tableName, nodeDefUuidColsParam, colsParam, offsetParam, filterParam, sortParam)
    return data
  }
}

export const updateTableNodeDefUuid = nodeDefUuidTable => dispatch =>
  dispatch({ type: dataQueryTableNodeDefUuidUpdate, nodeDefUuidTable })

export const updateTableNodeDefUuidCols = (nodeDefUuidCols, nodeDefUuidCol = null, nodeDefUuidColDeleted = false) =>
  async (dispatch, getState) => {
    const state = getState()

    dispatch({ type: dataQueryTableNodeDefUuidColsUpdate, nodeDefUuidCols })

    const sort = DataQueryState.getTableSort(state)
    const newSort = DataSort.retainVariables(getColNames(state, nodeDefUuidCols))(sort)
    if (DataSort.toString(sort) !== DataSort.toString(newSort)) {
      dispatch({ type: dataQueryTableSortUpdate, sort: newSort })
    }

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
      const cycle = SurveyState.getSurveyCycleKey(state)
      const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
      const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
      const filter = R.defaultTo(DataQueryState.getTableFilter(state), queryFilter)
      const sort = R.defaultTo(DataQueryState.getTableSort(state), querySort)
      const editMode = R.defaultTo(DataQueryState.getTableEditMode(state), editModeParam)
      const tableName = getTableName(state, nodeDefUuidTable)
      const cols = getColNames(state, nodeDefUuidCols)

      const { offset, limit } = DataQueryState.defaults

      const [countResp, dataResp] = await Promise.all([
        axios.post(
          `/api/surveyRdb/${surveyId}/${tableName}/query/count`, {
            filter: filter && JSON.stringify(filter),
          }
        ),
        queryTable(surveyId, cycle, editMode, nodeDefUuidTable, tableName, nodeDefUuidCols, cols, offset, filter, sort)
      ])

      dispatch({
        type: dataQueryTableInit,
        offset,
        limit,
        filter,
        sort,
        count: countResp.data,
        data: dataResp.data,
        nodeDefUuidTable,
        nodeDefUuidCols,
        editMode,
      })
    }
  }

export const updateTableOffset = (offset = 0) => async (dispatch, getState) => {
  const data = await fetchData(getState(), null, offset)
  dispatch({ type: dataQueryTableDataUpdate, offset, data })
}

export const resetTableFilter = () => dispatch => {
  dispatch({ type: dataQueryTableFilterUpdate, filter: null })
  dispatch(initTableData())
}

export const updateTableFilter = (filter) => dispatch => dispatch(initTableData(filter))

export const updateTableSort = (sort) => dispatch => dispatch(initTableData(null, sort))

export const updateTableEditMode = editMode => dispatch => dispatch(initTableData(null, null, editMode))

// ====== nodeDefSelectors
export const dataQueryNodeDefSelectorsShowUpdate = 'dataQuery/nodeDefSelectors/show/update'

export const toggleNodeDefsSelector = () => (dispatch, getState) =>
  dispatch({ type: dataQueryNodeDefSelectorsShowUpdate, show: !DataQueryState.isNodeDefSelectorsVisible(getState()) })