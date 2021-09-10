import React from 'react'
import axios from 'axios'

import * as Survey from '@core/survey/survey'

import DownloadButton from '@webapp/components/form/downloadButton'
import { JobActions } from '@webapp/store/app'
import { DataTestId } from '@webapp/utils/dataTestId'

import * as SurveyState from '../state'

export const exportSurvey =
  ({ includeData = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)

    const {
      data: { job, outputFileName: fileName },
    } = await axios.get(`/api/survey/${surveyId}/export/`, { params: { includeData } })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: (
          <DownloadButton
            id={DataTestId.surveyExport.downloadBtn}
            href={`/api/survey/${surveyId}/export/download`}
            requestParams={{ fileName, surveyName }}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
          />
        ),
      })
    )
  }
