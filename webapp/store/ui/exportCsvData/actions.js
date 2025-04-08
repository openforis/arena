import * as API from '@webapp/service/api'

import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'

import { DataExportDownloadButton } from '@webapp/views/App/views/Data/DataExport/DataExportDownloadButton'
import { DataSummaryExportDownloadButton } from '@webapp/views/App/views/Data/DataExport/DataSummaryExportDownloadButton'

export const startCSVExport =
  ({ recordUuids, search, options }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const job = await API.startExportDataJob({ surveyId, cycle, recordUuids, search, options })

    dispatch(JobActions.showJobMonitor({ job, closeButton: DataExportDownloadButton }))
  }

export const startDataSummaryExport =
  ({ options } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    const lang = SurveyState.getSurveyPreferredLang(state)

    const job = await API.startExportDataSummaryJob({ surveyId, cycle, lang, options })

    dispatch(JobActions.showJobMonitor({ job, closeButton: DataSummaryExportDownloadButton }))
  }
