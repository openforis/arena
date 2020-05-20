import * as R from 'ramda'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as DataSort from '@common/surveyRdb/dataSort'
import * as SurveyState from '@webapp/survey/surveyState'
import * as DataQueryState from '@webapp/loggedin/modules/data/dataVis/dataQuery/dataQueryState'

import { fetchData, initTableData } from './fetch'

export const dataQueryTableNodeDefUuidUpdate = 'dataQuery/table/nodeDefUuid/update'
export const dataQueryTableNodeDefUuidColsUpdate = 'dataQuery/table/nodeDefUuidCols/update'
export const dataQueryTableDataColUpdate = 'dataQuery/table/data/col/update'
export const dataQueryTableDataColDelete = 'dataQuery/table/data/col/delete'
export const dataQueryTableDataUpdate = 'dataQuery/table/data/update'
export const dataQueryTableFilterUpdate = 'dataQuery/table/filter/update'
export const dataQueryTableSortUpdate = 'dataQuery/table/sort/update'

// ==== Table
export const updateTableNodeDefUuid = (nodeDefUuidTable) => ({
  type: dataQueryTableNodeDefUuidUpdate,
  nodeDefUuidTable,
})

// ==== Table columns
const getColNames = (state, nodeDefUuidCols) => {
  const survey = SurveyState.getSurvey(state)
  return NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
}

export const updateTableNodeDefUuidCols = (
  nodeDefUuidCols,
  nodeDefUuidCol = null,
  nodeDefUuidColDeleted = false
) => async (dispatch, getState) => {
  const state = getState()

  dispatch({ type: dataQueryTableNodeDefUuidColsUpdate, nodeDefUuidCols })

  const sort = DataQueryState.getTableSort(state)
  const newSort = DataSort.retainVariables(getColNames(state, nodeDefUuidCols))(sort)
  if (DataSort.toString(sort) !== DataSort.toString(newSort)) {
    dispatch({ type: dataQueryTableSortUpdate, sort: newSort })
  }

  const fetch = !R.isEmpty(nodeDefUuidCols) && Boolean(nodeDefUuidCol) && !nodeDefUuidColDeleted

  if (fetch) {
    const hasTableAndCols = DataQueryState.hasTableAndCols(state)
    if (hasTableAndCols) {
      const data = await fetchData({ state, nodeDefUuidCols: [nodeDefUuidCol] })
      dispatch({ type: dataQueryTableDataColUpdate, data })
    } else {
      dispatch(initTableData({ filter: DataQueryState.getTableFilter(state) }))
    }
  } else if (nodeDefUuidColDeleted) {
    // Reset data
    if (R.isEmpty(nodeDefUuidCols)) {
      dispatch({ type: dataQueryTableDataUpdate, offset: 0, data: [] })
    }
    // Delete cols from data rows
    else {
      dispatch({
        type: dataQueryTableDataColDelete,
        cols: getColNames(state, [nodeDefUuidCol]),
      })
    }
  }
}

// ==== Table offset
export const updateTableOffset = (offset = 0) => async (dispatch, getState) => {
  const data = await fetchData({ state: getState(), offset })
  dispatch({ type: dataQueryTableDataUpdate, offset, data })
}

// ==== Table filter
export const resetTableFilter = () => (dispatch) => {
  dispatch({ type: dataQueryTableFilterUpdate, filter: null })
  dispatch(initTableData())
}

export const updateTableFilter = (filter) => (dispatch) => dispatch(initTableData({ filter }))

// ==== Table sort
export const updateTableSort = (sort) => (dispatch) => dispatch(initTableData({ sort }))

// ==== Table mode
export const updateTableEditMode = (editMode) => (dispatch) => dispatch(initTableData({ editMode }))
