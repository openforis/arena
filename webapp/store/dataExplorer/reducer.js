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
    setEditMode: (state, action) => DataExplorerState.assocEditMode(action.payload)(state),

    setQuery: (state, action) => DataExplorerState.assocQuery(action.payload)(state),

    setSelectedQuerySummaryUuid: (state, action) =>
      DataExplorerState.assocSelectedQuerySummaryUuid(action.payload)(state),
  },
})

const { setQuery, setSelectedQuerySummaryUuid } = slice.actions

export const DataExplorerActions = {
  setQuery,
  setSelectedQuerySummaryUuid,
}

export const { reducer: DataExplorerReducer } = slice
