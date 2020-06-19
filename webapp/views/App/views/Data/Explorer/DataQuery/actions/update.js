import * as Survey from '@core/survey/survey'
import { ColumnNodeDef } from '@common/model/db'
import * as DataSort from '@common/surveyRdb/dataSort'
import { SurveyState } from '@webapp/store/survey'
import * as DataQueryState from '@webapp/views/App/views/Data/Explorer/DataQuery/state'

import { fetchData, initTableData, dataQueryTableInit } from './fetch'

export const dataQueryTableNodeDefUuidUpdate = 'dataQuery/table/nodeDefUuid/update'
export const dataQueryTableNodeDefUuidColsUpdate = 'dataQuery/table/nodeDefUuidCols/update'
export const dataQueryTableDataColUpdate = 'dataQuery/table/data/col/update'
export const dataQueryTableDataColDelete = 'dataQuery/table/data/col/delete'
export const dataQueryTableDataUpdate = 'dataQuery/table/data/update'
export const dataQueryDimensionsUpdate = 'dataQuery/dimensions/update'
export const dataQueryMeasuresUpdate = 'dataQuery/measures/update'
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
  const nodeDefs = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  return nodeDefs.flatMap(ColumnNodeDef.getColNames)
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

  const fetch = nodeDefUuidCols.length > 0 && Boolean(nodeDefUuidCol) && !nodeDefUuidColDeleted

  if (fetch) {
    if (DataQueryState.hasTableAndCols(state)) {
      const data = await fetchData({ state, nodeDefUuidCols: [nodeDefUuidCol] })
      dispatch({ type: dataQueryTableDataColUpdate, data })
    } else {
      dispatch(initTableData({ filter: DataQueryState.getTableFilter(state) }))
    }
  } else if (nodeDefUuidColDeleted) {
    // Reset data
    if (nodeDefUuidCols.length === 0) {
      dispatch({
        type: dataQueryTableDataUpdate,
        offset: DataQueryState.defaults.offset,
        data: DataQueryState.defaults.data,
      })
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

export const updateTableMeasures = (measuresUpdate) => (dispatch) => {
  // const measures = DataQueryState.getTableMeasures
  dispatch({ type: dataQueryMeasuresUpdate, measures: measuresUpdate })
}

export const updateTableDimensions = (dimensionsUpdate) => (dispatch) => {
  dispatch({ type: dataQueryDimensionsUpdate, dimensions: dimensionsUpdate })
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
export const toggleTableModeEdit = () => (dispatch, getState) => {
  const modeEdit = DataQueryState.isTableModeEdit(getState())
  dispatch(initTableData({ mode: modeEdit ? null : DataQueryState.modes.edit }))
}

export const toggleTableModeAggregate = () => (dispatch, getState) => {
  const state = getState()
  dispatch({
    type: dataQueryTableInit,
    ...DataQueryState.defaults,
    nodeDefUuidTable: DataQueryState.getTableNodeDefUuidTable(state),
    mode: DataQueryState.isTableModeAggregate(state) ? null : DataQueryState.modes.aggregate,
  })
}
