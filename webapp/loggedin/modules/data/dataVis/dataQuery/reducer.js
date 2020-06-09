import { exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import { nodesUpdate } from '@webapp/loggedin/surveyViews/record/actions'
import { dataVisReset } from '@webapp/loggedin/modules/data/dataVis/actions'

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
  dataQueryMeasuresUpdate,
  dataQueryDimensionsUpdate,
} from './actions'
import * as DataQueryState from './state'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Table
  [dataQueryTableNodeDefUuidUpdate]: (state, { nodeDefUuidTable }) =>
    DataQueryState.assocNodeDefUuidTable(nodeDefUuidTable)(state),

  [dataQueryTableNodeDefUuidColsUpdate]: (state, { nodeDefUuidCols }) =>
    DataQueryState.assocNodeDefUuidCols(nodeDefUuidCols)(state),

  [dataQueryTableDataColUpdate]: (state, { data }) => DataQueryState.assocTableDataCol(data)(state),

  [dataQueryTableDataColDelete]: (state, { cols }) => DataQueryState.dissocTableDataCols(cols)(state),

  [dataQueryTableInit]: (
    state,
    { offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, dimensions, measures, mode }
  ) =>
    DataQueryState.initTableData({
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
    })(state),

  [dataQueryTableDataUpdate]: (state, { offset, data }) => DataQueryState.assocTableData(offset, data)(state),

  [dataQueryTableFilterUpdate]: (state, { filter }) => DataQueryState.assocTableFilter(filter)(state),

  [dataQueryTableSortUpdate]: (state, { sort }) => DataQueryState.assocTableSort(sort)(state),

  [dataQueryTableDataValidationUpdate]: (state, { recordUuid, validations }) =>
    DataQueryState.assocTableDataRecordNodeValidations(recordUuid, validations)(state),

  [dataQueryMeasuresUpdate]: (state, { measures }) => DataQueryState.assocMeasures(measures)(state),

  [dataQueryDimensionsUpdate]: (state, { dimensions }) => DataQueryState.assocDimensions(dimensions)(state),

  // Data vis
  [dataVisReset]: () => ({}),

  // Record nodes update
  [nodesUpdate]: (state, { nodes }) => DataQueryState.assocTableDataRecordNodes(nodes)(state),

  // NodeDefsSelector
  [dataQueryNodeDefSelectorsShowUpdate]: (state, { show }) => DataQueryState.assocShowNodeDefSelectors(show)(state),
}

export default exportReducer(actionHandlers)
