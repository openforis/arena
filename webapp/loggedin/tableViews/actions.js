import axios from 'axios'

import * as TableViewsState from './tableViewsState'

export const tableViewsListUpdate = 'tableViews/list/update'

const _initList = (module, moduleApiUri, restParams, offset) => async (dispatch, getState) => {
  const state = getState()

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
    moduleApiUri,
    offset,
    limit,
    ...countResp.data,
    ...itemsResp.data,
  })
}

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
  await dispatch(_initList(module, moduleApiUri, restParams, offset))
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

export const resetList = (module, restParams) => async (dispatch, getState) => {
  const state = getState()
  const moduleApiUri = TableViewsState.getModuleApiUri(module)(state)
  await dispatch(_initList(module, moduleApiUri, restParams, 0))
}

