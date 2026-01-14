import React from 'react'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import { ButtonDownload } from '@webapp/components/buttons'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

import * as SurveyState from '../state'

const getOutputFileName = ({ includeData, includeResultAttributes, includeActivityLog }) => {
  const parts = [includeData ? 'arena_backup' : 'arena_survey']
  if (includeData) {
    if (!includeActivityLog) {
      parts.push('no_log')
    }
    if (!includeResultAttributes) {
      parts.push('no_result_attributes')
    }
  }
  parts.push(DateUtils.nowFormatDefault())
  return `${parts.join('_')}.zip`
}

export const exportSurvey =
  ({ includeData = false, includeResultAttributes = true, includeActivityLog = true } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)

    const {
      data: { job, outputFileName: fileName },
    } = await axios.get(`/api/survey/${surveyId}/export/`, {
      params: { includeData, includeResultAttributes, includeActivityLog },
    })

    const outputFileName = getOutputFileName({ includeData, includeResultAttributes, includeActivityLog })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: (
          <ButtonDownload
            testId={TestId.surveyExport.downloadBtn}
            fileName={outputFileName}
            href={`/api/survey/${surveyId}/export/download`}
            requestParams={{ fileName, surveyName, includeData, includeResultAttributes, includeActivityLog }}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
            variant="contained"
          />
        ),
      })
    )
  }
