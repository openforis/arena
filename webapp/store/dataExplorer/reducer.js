import { createSlice } from '@reduxjs/toolkit'

import { Query } from '@common/model/query'

import { DataExplorerState } from './state'

const initialState = {
  [DataExplorerState.keys.displayType]: DataExplorerState.displayTypes.table,
  [DataExplorerState.keys.chartType]: DataExplorerState.chartTypes.bar,
  [DataExplorerState.keys.editMode]: false,
  [DataExplorerState.keys.nodeDefsSelectorVisible]: true,
  [DataExplorerState.keys.query]: Query.create(),
  [DataExplorerState.keys.selectedQuerySummaryUuid]: null,
  [DataExplorerState.keys.codesVisible]: false,
}

export const slice = createSlice({
  name: 'dataQuery',
  initialState,
  reducers: {
    reset: () => initialState,

    setChartType: (state, action) => DataExplorerState.assocChartType(action.payload)(state),

    setDisplayType: (state, action) => DataExplorerState.assocDisplayType(action.payload)(state),

    setEditMode: (state, action) => DataExplorerState.assocEditMode(action.payload)(state),

    setNodeDefsSelectorVisible: (state, action) =>
      DataExplorerState.assocNodeDefsSelectorVisible(action.payload)(state),

    setQuery: (state, action) => DataExplorerState.assocQuery(action.payload)(state),

    setSelectedQuerySummaryUuid: (state, action) =>
      DataExplorerState.assocSelectedQuerySummaryUuid(action.payload)(state),

    setCodesVisible: (state, action) => DataExplorerState.assocCodesVisible(action.payload)(state),

    openRecordEditModal: (state, action) => DataExplorerState.assocRecordEditModalProps(action.payload)(state),

    closeRecordEditModal: (state) => DataExplorerState.dissocRecordEditModalProps(state),
  },
})

const {
  reset,
  setChartType,
  setDisplayType,
  setNodeDefsSelectorVisible,
  setQuery,
  setSelectedQuerySummaryUuid,
  setCodesVisible,
  openRecordEditModal,
  closeRecordEditModal,
} = slice.actions

export const DataExplorerActions = {
  reset,
  setChartType,
  setDisplayType,
  setNodeDefsSelectorVisible,
  setQuery,
  setSelectedQuerySummaryUuid,
  setCodesVisible,
  openRecordEditModal,
  closeRecordEditModal,
}

export const { reducer: DataExplorerReducer } = slice
