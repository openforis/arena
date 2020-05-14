import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

import { dataVisReset } from '../actions'

import { nodesUpdate } from '../../../../surveyViews/record/actions'
import {
  dataQueryTableNodeDefUuidUpdate,
  dataQueryTableNodeDefUuidColsUpdate,
  dataQueryTableDataColUpdate,
  dataQueryTableDataColDelete,
  dataQueryTableInit,
  dataQueryTableDataUpdate,
  dataQueryTableFilterUpdate,
  dataQueryTableSortUpdate,
  dataQueryNodeDefSelectorsShowUpdate,
  dataQueryTableDataValidationUpdate,
} from './actions'
import * as DataQueryState from './dataQueryState'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Table
  [dataQueryTableNodeDefUuidUpdate]: (state, { nodeDefUuidTable }) =>
    DataQueryState.assocNodeDefUuidTable(nodeDefUuidTable)(state),

  [dataQueryTableNodeDefUuidColsUpdate]: (state, { nodeDefUuidCols }) =>
    DataQueryState.assocNodeDefUuidCols(nodeDefUuidCols)(state),

  [dataQueryTableDataColUpdate]: (state, { data }) => DataQueryState.assocTableDataCol(data)(state),

  [dataQueryTableDataColDelete]: (state, { cols }) => DataQueryState.dissocTableDataCols(cols)(state),

  [dataQueryTableInit]: (
    state,
    { offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode }
  ) =>
    DataQueryState.initTableData(
      offset,
      limit,
      filter,
      sort,
      count,
      data,
      nodeDefUuidTable,
      nodeDefUuidCols,
      editMode
    )(state),

  [dataQueryTableDataUpdate]: (state, { offset, data }) => DataQueryState.assocTableData(offset, data)(state),

  [dataQueryTableFilterUpdate]: (state, { filter }) => DataQueryState.assocTableFilter(filter)(state),

  [dataQueryTableSortUpdate]: (state, { sort }) => DataQueryState.assocTableSort(sort)(state),

  [dataQueryTableDataValidationUpdate]: (state, { recordUuid, validations }) =>
    DataQueryState.assocTableDataRecordNodeValidations(recordUuid, validations)(state),

  // Data vis
  [dataVisReset]: () => ({}),

  // Record nodes update
  [nodesUpdate]: (state, { nodes }) => DataQueryState.assocTableDataRecordNodes(nodes)(state),

  // NodeDefsSelector
  [dataQueryNodeDefSelectorsShowUpdate]: (state, { show }) => DataQueryState.assocShowNodeDefSelectors(show)(state),
}

export default exportReducer(actionHandlers)
