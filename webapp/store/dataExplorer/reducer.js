import { createSlice } from '@reduxjs/toolkit'

import { Query } from '@common/model/query'

import { DataExplorerState } from './state'

const initialState = {
  displayType: 'table',
  editMode: false,
  nodeDefsSelectorVisible: true,
  query: Query.create(),
  selectedQuerySummaryUuid: null,
}

export const slice = createSlice({
  name: 'dataQuery',
  initialState,
  reducers: {
    reset: () => initialState,

    setDisplayType: (state, action) => DataExplorerState.assocDisplayType(action.payload)(state),

    setEditMode: (state, action) => DataExplorerState.assocEditMode(action.payload)(state),

    setNodeDefsSelectorVisible: (state, action) =>
      DataExplorerState.assocNodeDefsSelectorVisible(action.payload)(state),

    setQuery: (state, action) => DataExplorerState.assocQuery(action.payload)(state),

    setSelectedQuerySummaryUuid: (state, action) =>
      DataExplorerState.assocSelectedQuerySummaryUuid(action.payload)(state),
  },
})

const { reset, setDisplayType, setNodeDefsSelectorVisible, setQuery, setSelectedQuerySummaryUuid } = slice.actions

export const DataExplorerActions = {
  reset,
  setDisplayType,
  setNodeDefsSelectorVisible,
  setQuery,
  setSelectedQuerySummaryUuid,
}

export const { reducer: DataExplorerReducer } = slice
