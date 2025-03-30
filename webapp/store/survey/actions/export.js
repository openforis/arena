import React from 'react'
import axios from 'axios'

import * as Survey from '@core/survey/survey'

import { ButtonDownload } from '@webapp/components/buttons'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

import * as SurveyState from '../state'

export const exportSurvey =
  ({ includeData = false, includeActivityLog = true } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)

    const {
      data: { job, outputFileName: fileName },
    } = await axios.get(`/api/survey/${surveyId}/export/`, { params: { includeData, includeActivityLog } })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: (
          <ButtonDownload
            testId={TestId.surveyExport.downloadBtn}
            href={`/api/survey/${surveyId}/export/download`}
            requestParams={{ fileName, surveyName, includeData, includeActivityLog }}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
            variant="contained"
          />
        ),
      })
    )
  }
