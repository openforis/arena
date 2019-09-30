import axios from 'axios'

import * as TableViewsState from './tableViewsState'
import * as SurveyState from '../../survey/surveyState'

export const tableViewsListUpdate = 'tableViews/list/update'

const getItems = (moduleApiUri, cycle, offset, limit) => axios.get(
  moduleApiUri,
  { params: { cycle, offset, limit } }
)

export const initList = (module, moduleApiUri) => async (dispatch, getState) => {
  const state = getState()
  const offset = TableViewsState.getOffset(module)(state)
  const limit = TableViewsState.getLimit(module)(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const [countResp, itemsResp] = await Promise.all([
    axios.get(`${moduleApiUri}/count`),
    getItems(moduleApiUri, cycle, offset, limit)
  ])

  dispatch({
    type: tableViewsListUpdate,
    module,
    offset,
    limit,
    ...countResp.data,
    ...itemsResp.data,
  })
}

export const fetchListItems = (module, moduleApiUri, offset) => async (dispatch, getState) => {
  const state = getState()

  const limit = TableViewsState.getLimit(module)(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const { data } = await getItems(moduleApiUri, cycle, offset, limit)

  dispatch({
    type: tableViewsListUpdate,
    module,
    offset,
    ...data,
  })

}
