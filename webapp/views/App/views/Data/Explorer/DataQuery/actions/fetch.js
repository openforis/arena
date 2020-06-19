import axios from 'axios'

import * as DataSort from '@common/surveyRdb/dataSort'
import { SurveyState } from '@webapp/store/survey'
import * as DataQueryState from '@webapp/views/App/views/Data/Explorer/DataQuery/state'

export const dataQueryTableInit = 'dataQuery/table/init'

export const fetchData = async (params) => {
  const {
    state,
    nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state),
    offset = DataQueryState.getTableOffset(state),
    filter = DataQueryState.getTableFilter(state),
    sort = DataQueryState.getTableSort(state),
    mode = DataQueryState.getTableMode(state),
  } = params
  if (DataQueryState.hasTableAndCols(state)) {
    const dataPost = {
      cycle: SurveyState.getSurveyCycleKey(state),
      nodeDefUuidCols: JSON.stringify(nodeDefUuidCols),
      offset,
      limit: DataQueryState.defaults.limit,
      filter: filter ? JSON.stringify(filter) : null,
      sort: DataSort.toHttpParams(sort),
      editMode: mode === DataQueryState.modes.edit,
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
    mode = DataQueryState.getTableMode(state),
  } = params

  if (DataQueryState.hasTableAndCols(state)) {
    const cycle = SurveyState.getSurveyCycleKey(state)
    const nodeDefUuidTable = DataQueryState.getTableNodeDefUuidTable(state)
    const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
    const { offset, limit, dimensions, measures } = DataQueryState.defaults

    const dataCountParams = { cycle, filter: filter && JSON.stringify(filter) }
    const [{ data: count }, data] = await Promise.all([
      axios.post(`/api/surveyRdb/${surveyId}/${nodeDefUuidTable}/query/count`, dataCountParams),
      fetchData({ state, mode, offset, filter, sort }),
    ])

    const payload = {
      offset,
      limit,
      filter,
      sort,
      count,
      data,
      nodeDefUuidTable,
      nodeDefUuidCols,
      dimensions,
      measures,
      mode,
    }
    dispatch({ type: dataQueryTableInit, ...payload })
  }
}
