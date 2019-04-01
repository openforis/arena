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
  dataQueryTableSortUpdate,
} from './actions'

import {
  initTableData,
  assocTableData,
  assocTableDataCol,
  assocTableFilter,
  assocTableSort,
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
    { offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode }
  ) =>
    initTableData(
      offset, limit, filter, sort, count, data,
      nodeDefUuidTable, nodeDefUuidCols,
      editMode
    )(state),

  [dataQueryTableDataUpdate]: (state, { offset, data }) => assocTableData(offset, data)(state),

  [dataQueryTableFilterUpdate]: (state, { filter }) => assocTableFilter(filter)(state),

  [dataQueryTableSortUpdate]: (state, { sort }) => assocTableSort(sort)(state),
}

export default exportReducer(actionHandlers)