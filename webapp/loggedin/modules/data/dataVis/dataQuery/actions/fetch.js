import axios from 'axios'

import * as DataSort from '@common/surveyRdb/dataSort'
import * as SurveyState from '@webapp/survey/surveyState'
import * as DataQueryState from '@webapp/loggedin/modules/data/dataVis/dataQuery/state'

export const dataQueryTableInit = 'dataQuery/table/init'

export const fetchData = async (params) => {
  const {
    state,
    nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state),
    offset = DataQueryState.getTableOffset(state),
    filter = DataQueryState.getTableFilter(state),
    sort = DataQueryState.getTableSort(state),
    editMode = DataQueryState.getTableEditMode(state),
  } = params
  if (DataQueryState.hasTableAndCols(state)) {
    const dataPost = {
      cycle: SurveyState.getSurveyCycleKey(state),
      nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
      offset,
      limit: DataQueryState.defaults.limit,
      filter: filter ? JSON.stringify(filter) : null,
      sort: DataSort.toHttpParams(sort),
      editMode,
    }
    const surveyId = SurveyState.getSurveyId(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const { data } = await axios.post(`/api/surveyRdb/${surveyId}/${nodeDefUuidTable}/query`, dataPost)
    return data
  }
  return null
}

export const initTableData = (params = {}) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const {
    filter = DataQueryState.getTableFilter(state),
    sort = DataQueryState.getTableSort(state),
    editMode = DataQueryState.getTableEditMode(state),
  } = params

  if (DataQueryState.hasTableAndCols(state)) {
    const cycle = SurveyState.getSurveyCycleKey(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)

    const { offset, limit } = DataQueryState.defaults

    const dataCountParams = { cycle, filter: filter && JSON.stringify(filter) }
    const [{ data: count }, data] = await Promise.all([
      axios.post(`/api/surveyRdb/${surveyId}/${nodeDefUuidTable}/query/count`, dataCountParams),
      fetchData({ state, editMode, offset, filter, sort }),
    ])

    dispatch({
      type: dataQueryTableInit,
      offset,
      limit,
      filter,
      sort,
      count,
      data,
      nodeDefUuidTable,
      nodeDefUuidCols,
      editMode,
    })
  }
}
