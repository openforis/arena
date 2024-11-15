import * as API from '@webapp/service/api'
import { DataExportDownloadButton } from '@webapp/views/App/views/Data/DataExport/DataExportDownloadButton'
import { SurveyState } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'

export const startCSVExport =
  ({ recordUuids, search, options }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const job = await API.startExportDataToCSVJob({ surveyId, cycle, recordUuids, search, options })

    dispatch(JobActions.showJobMonitor({ job, closeButton: DataExportDownloadButton }))
  }
