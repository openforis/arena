import axios from 'axios'

import * as TableViewsState from './tableViewsState'

export const tableViewsListUpdate = 'tableViews/list/update'

const _getItems = (moduleApiUri, restParams, offset, limit) => axios.get(
  moduleApiUri,
  {
    params: { offset, limit, ...restParams }
  }
)

const _initList = (module, moduleApiUri, restParams, offset) => async (dispatch, getState) => {
  const state = getState()

  const limit = TableViewsState.getLimit(module)(state)

  const [countResp, itemsResp] = await Promise.all([
    axios.get(
      `${moduleApiUri}/count`,
      { params: restParams }
    ),
    _getItems(moduleApiUri, restParams, offset, limit)
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

export const initListItems = (module, moduleApiUri, restParams) => async (dispatch, getState) => {
  const state = getState()
  const offset = TableViewsState.getOffset(module)(state)
  await dispatch(_initList(module, moduleApiUri, restParams, offset))
}

export const fetchListItems = (module, moduleApiUri, offset, restParams) => async (dispatch, getState) => {
  const limit = TableViewsState.getLimit(module)(getState())

  const { data } = await _getItems(moduleApiUri, restParams, offset, limit)

  dispatch({
    type: tableViewsListUpdate,
    module,
    offset,
    ...data,
  })

}

export const reloadListItems = (module, restParams) => async (dispatch, getState) => {
  const state = getState()
  const moduleApiUri = TableViewsState.getModuleApiUri(module)(state)
  await dispatch(_initList(module, moduleApiUri, restParams, 0))
}
