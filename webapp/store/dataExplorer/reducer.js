import { createSlice } from '@reduxjs/toolkit'

import { DataExplorerState } from './state'

const initialState = {
  editMode: false,
  query: null,
  selectedQuerySummaryUuid: null,
}

export const slice = createSlice({
  name: 'dataQuery',
  initialState,
  reducers: {
    setEditMode: (state) => DataExplorerState.assocEditMode(state),
    setQuery: (state) => DataExplorerState.assocQuery(state),
    setSelectedQuerySummaryUuid: (state) => DataExplorerState.assocSelectedQuerySummaryUuid(state),
  },
})

const { setQuery, setSelectedQuerySummaryUuid } = slice.actions

export const DataExplorerActions = {
  setQuery,
  setSelectedQuerySummaryUuid,
}

export const { reducer: DataExplorerReducer } = slice
