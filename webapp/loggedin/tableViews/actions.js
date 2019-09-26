import axios from 'axios'

import * as TableViewsState from './tableViewsState'

export const tableViewsModuleActiveUpdate = 'tableViews/moduleActive/update'
export const tableViewsListUpdate = 'tableViews/list/update'

const getItems = (moduleApiUri, offset, limit) => axios.get(
  moduleApiUri,
  { params: { offset, limit } }
)

export const initList = (moduleApiUri, module) => async (dispatch, getState) => {
  dispatch({ type: tableViewsModuleActiveUpdate, module })

  const state = getState()

  const offset = TableViewsState.getOffset(module)(state)
  const limit = TableViewsState.getLimit(module)(state)

  const [countResp, itemsResp] = await Promise.all([
    axios.get(`${moduleApiUri}/count`),
    getItems(moduleApiUri, offset, limit)
  ])

  dispatch({
    type: tableViewsListUpdate,
    offset,
    limit,
    ...countResp.data,
    ...itemsResp.data,
  })
}

export const fetchListItems = (moduleApiUri, offset) => async (dispatch, getState) => {
  const state = getState()

  const module = TableViewsState.getModuleActive(state)
  const limit = TableViewsState.getLimit(module)(state)

  const { data } = await getItems(moduleApiUri, offset, limit)

  dispatch({
    type: tableViewsListUpdate,
    offset,
    ...data,
  })

}
