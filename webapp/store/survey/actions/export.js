import React from 'react'
import axios from 'axios'

import * as Survey from '@core/survey/survey'

import { ButtonDownload } from '@webapp/components/buttons'
import { JobActions } from '@webapp/store/app'
import { TestId } from '@webapp/utils/testId'

import * as SurveyState from '../state'

export const exportSurvey =
  ({ includeData = false, includeResultAttributes = true, includeActivityLog = true } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)

    const {
      data: { job },
    } = await axios.get(`/api/survey/${surveyId}/export/`, {
      params: { includeData, includeResultAttributes, includeActivityLog },
    })

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: ({ job: jobComplete }) => (
          <ButtonDownload
            testId={TestId.surveyExport.downloadBtn}
            downloadInMemory={false}
            href={`/api/survey/${surveyId}/export/download`}
            onClick={() => dispatch(JobActions.hideJobMonitor())}
            requestParams={{
              surveyName,
              includeData,
              includeResultAttributes,
              includeActivityLog,
              downloadToken: jobComplete.result.downloadToken,
            }}
            variant="contained"
          />
        ),
      })
    )
  }
