import axios from 'axios'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Survey from '@core/survey/survey'

import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import * as SurveyState from '../state'
import { setActiveSurvey } from './active'

// The only job RecordCheckJob is expected to intentionally fail with (via setStatusFailed(), rather
// than an unexpected crash) is this record-values-update check - see recordCheckJob.js.
const RECORD_CHECK_JOB_TYPE = 'RecordCheckJob'

export const publishSurvey =
  ({ cleanupRecords = false, updateRecordValues = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { data } = await axios.put(`/api/survey/${surveyId}/publish`, { cleanupRecords, updateRecordValues })

    dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: async () => {
          await dispatch(setActiveSurvey(surveyId, true))
        },
        onFail: (job) => {
          const failedInnerJob = JobSerialized.getInnerJobs(job).find(JobSerialized.isFailed)
          if (JobSerialized.getType(failedInnerJob) !== RECORD_CHECK_JOB_TYPE) {
            // Real failure (validation error, unexpected crash, etc.): let the generic JobErrors UI show it.
            return
          }

          const attributeNames = Object.keys(JobSerialized.getErrors(job)).join(', ')

          const currentState = getState()
          const surveyInfo = SurveyState.getSurveyInfo(currentState)
          const surveyLabel = Survey.getLabel(surveyInfo, SurveyState.getSurveyPreferredLang(currentState))

          dispatch(JobActions.hideJobMonitor())

          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'common.publishRecordValuesUpdateConfirm',
              params: { survey: surveyLabel, attributeNames },
              headerText: 'common.publishRecordValuesUpdateConfirmHeader',
              strongConfirm: true,
              strongConfirmInputLabel: 'common.publishRecordValuesUpdateConfirmInputLabel',
              strongConfirmRequiredText: surveyLabel,
              onOk: publishSurvey({ cleanupRecords, updateRecordValues: true }),
            })
          )
        },
      })
    )
  }
