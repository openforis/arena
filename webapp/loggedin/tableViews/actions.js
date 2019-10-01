import axios from 'axios'

import * as TableViewsState from './tableViewsState'

export const tableViewsListUpdate = 'tableViews/list/update'

const getItems = (moduleApiUri, offset, limit, restParams) => axios.get(
  moduleApiUri, {
    params: {
      offset,
      limit,
      ...restParams
    }
  }
)

export const initList = (module, moduleApiUri, restParams) => async (dispatch, getState) => {
  const state = getState()
  const offset = TableViewsState.getOffset(module)(state)
  const limit = TableViewsState.getLimit(module)(state)

  const [countResp, itemsResp] = await Promise.all([
    axios.get(`${moduleApiUri}/count`, {
      params: restParams
    }),
    getItems(moduleApiUri, offset, limit, restParams)
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

export const fetchListItems = (module, moduleApiUri, offset, restParams) => async (dispatch, getState) => {
  const state = getState()

  const limit = TableViewsState.getLimit(module)(state)

  const { data } = await getItems(moduleApiUri, offset, limit, restParams)

  dispatch({
    type: tableViewsListUpdate,
    module,
    offset,
    ...data,
  })

}
