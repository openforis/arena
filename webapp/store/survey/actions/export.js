import React from 'react'
import axios from 'axios'

import * as Survey from '@core/survey/survey'

import { JobActions } from '@webapp/store/app'

import DownloadButton from '@webapp/components/form/downloadButton'
import * as SurveyState from '../state'

export const exportSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyId = Survey.getId(survey)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyName = Survey.getName(surveyInfo)

  const {
    data: { job, outputFileName },
  } = await axios.get(`/api/survey/${surveyId}/export/`)

  dispatch(
    JobActions.showJobMonitor({
      job,
      closeButton: (
        <DownloadButton
          href={`/api/survey/${surveyId}/export/download`}
          requestParams={{ outputFileName, surveyName }}
          onClick={() => dispatch(JobActions.hideJobMonitor())}
        />
      ),
    })
  )
}
