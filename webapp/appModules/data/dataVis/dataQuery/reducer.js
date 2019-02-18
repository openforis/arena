import { exportReducer } from '../../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../../app/actions'

import {
  dataQueryTableNodeDefUuidUpdate,
  dataQueryTableNodeDefUuidColsUpdate,
  dataQueryTableDataColUpdate,
  dataQueryTableDataColDelete,
  dataQueryTableInit,
  dataQueryTableDataUpdate,
  dataQueryTableFilterUpdate,
} from './actions'

import {
  initTableData,
  resetTableData,
  assocTableData,
  assocTableDataCol,
  assocTableFilter,
  assocNodeDefUuidTable,
  assocNodeDefUuidCols, dissocTableDataCols,
} from './dataQueryState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [dataQueryTableNodeDefUuidUpdate]: (state, { nodeDefUuidTable }) =>
    assocNodeDefUuidTable(nodeDefUuidTable)(state),

  [dataQueryTableNodeDefUuidColsUpdate]: (state, { nodeDefUuidCols }) =>
    assocNodeDefUuidCols(nodeDefUuidCols)(state),

  [dataQueryTableDataColUpdate]: (state, { data }) =>
    assocTableDataCol(data)(state),

  [dataQueryTableDataColDelete]: (state, { cols }) =>
    dissocTableDataCols(cols)(state),

  [dataQueryTableInit]: (
    state,
    { offset, limit, filter, count, data, nodeDefUuidTable, nodeDefUuidCols }
  ) =>
    initTableData(
      offset, limit, filter, count, data,
      nodeDefUuidTable, nodeDefUuidCols
    )(state),

  [dataQueryTableDataUpdate]: (state, { offset, data }) => assocTableData(offset, data)(state),

  [dataQueryTableFilterUpdate]: (state, { filter }) => assocTableFilter(filter)(state)
}

export default exportReducer(actionHandlers)