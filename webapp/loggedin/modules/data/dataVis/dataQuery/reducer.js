import { exportReducer } from '../../../../../utils/reduxUtils'

import * as DataQueryState from './dataQueryState'

import { appUserLogout } from '../../../../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../../survey/actions'

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
} from './actions'

import { dataVisReset } from '../actions'

import { nodesUpdate, validationsUpdate } from '../../../../surveyViews/record/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // table
  [dataQueryTableNodeDefUuidUpdate]: (state, { nodeDefUuidTable }) => DataQueryState.assocNodeDefUuidTable(nodeDefUuidTable)(state),

  [dataQueryTableNodeDefUuidColsUpdate]: (state, { nodeDefUuidCols }) => DataQueryState.assocNodeDefUuidCols(nodeDefUuidCols)(state),

  [dataQueryTableDataColUpdate]: (state, { data }) => DataQueryState.assocTableDataCol(data)(state),

  [dataQueryTableDataColDelete]: (state, { cols }) => DataQueryState.dissocTableDataCols(cols)(state),

  [dataQueryTableInit]: (
    state,
    { offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode }
  ) =>
    DataQueryState.initTableData(
      offset, limit, filter, sort, count, data,
      nodeDefUuidTable, nodeDefUuidCols,
      editMode
    )(state),

  [dataQueryTableDataUpdate]: (state, { offset, data }) => DataQueryState.assocTableData(offset, data)(state),

  [dataQueryTableFilterUpdate]: (state, { filter }) => DataQueryState.assocTableFilter(filter)(state),

  [dataQueryTableSortUpdate]: (state, { sort }) => DataQueryState.assocTableSort(sort)(state),

  // data vis
  [dataVisReset]: () => ({}),

  // record nodes update
  [nodesUpdate]: (state, { nodes }) => DataQueryState.assocTableDataRecordNodes(nodes)(state),

  [validationsUpdate]: (state, { recordUuid, recordValid }) => DataQueryState.assocTableDataRecordNodeValidations(recordUuid, recordValid)(state),

  // nodeDefsSelector
  [dataQueryNodeDefSelectorsShowUpdate]: (state, { show }) => DataQueryState.assocShowNodeDefSelectors(show)(state)
}

export default exportReducer(actionHandlers)