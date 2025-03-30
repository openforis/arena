import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'

import { defaultDataExportOptionsSelection } from '@webapp/views/App/views/Data/DataExport/dataExportOptions'
import * as API from '@webapp/service/api'

import { DataExplorerState } from './state'
import * as SurveyState from '../survey/state'
import { notifyWarning } from '../ui/notification/actions'

const initialState = {
  [DataExplorerState.keys.displayType]: DataExplorerState.displayTypes.table,
  [DataExplorerState.keys.chartType]: DataExplorerState.chartTypes.bar,
  [DataExplorerState.keys.editMode]: false,
  [DataExplorerState.keys.nodeDefsSelectorVisible]: true,
  [DataExplorerState.keys.query]: Query.create(),
  [DataExplorerState.keys.selectedQuerySummaryUuid]: null,
  [DataExplorerState.keys.codesVisible]: false,
}

const exportQueryData = createAsyncThunk('dataQuery/exportData', async (params, { dispatch, getState }) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const query = DataExplorerState.getQuery(state)
  const entityDefUuid = Query.getEntityDefUuid(query)
  const options = { ...defaultDataExportOptionsSelection, ...params }
  const { fileFormat } = options
  try {
    const tempFileName = await API.exportDataQueryToTempFile({ surveyId, cycle, query, options })
    API.downloadDataQueryExport({ surveyId, cycle, entityDefUuid, tempFileName, fileFormat })
  } catch (error) {
    const key =
      fileFormat === FileFormats.xlsx ? 'appErrors:dataExport..excelMaxCellsLimitExceeded' : 'dataExportView.error'
    dispatch(notifyWarning({ key, params: { details: String(error) } }))
  }
})

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
  extraReducers: (builder) => {
    builder.addCase(exportQueryData.fulfilled, (state) => state)
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
  exportQueryData,
}

export const { reducer: DataExplorerReducer } = slice
