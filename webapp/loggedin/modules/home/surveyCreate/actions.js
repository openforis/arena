import axios from 'axios'
import * as R from 'ramda'

import * as JobSerialized from '@common/job/jobSerialized'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'

import * as SurveyCreateState from './surveyCreateState'

export const surveyCreateNewSurveyUpdate = 'surveyCreate/newSurvey/update'

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {
  const newSurvey = R.pipe(
    SurveyCreateState.getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value)
  )(getState())

  dispatch({
    type: surveyCreateNewSurveyUpdate,
    [SurveyCreateState.keys.newSurvey]: newSurvey,
  })
}

export const createSurvey = (surveyProps) => async (dispatch, getState) => {
  const {
    data: { survey, validation },
  } = await axios.post('/api/survey', surveyProps)

  if (survey) {
    dispatch({ type: SurveyActions.surveyCreate, survey })
  } else {
    dispatch({
      type: surveyCreateNewSurveyUpdate,
      [SurveyCreateState.keys.newSurvey]: {
        ...SurveyCreateState.getNewSurvey(getState()),
        validation,
      },
    })
  }
}

export const resetNewSurvey = () => (dispatch) => {
  dispatch({
    type: surveyCreateNewSurveyUpdate,
    [SurveyCreateState.keys.newSurvey]: SurveyCreateState.newSurveyDefault,
  })
}

export const importCollectSurvey = (file) => async (dispatch) => {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axios.post('/api/survey/collect-import', formData)

  dispatch(
    JobActions.showJobMonitor({
      job: data.job,
      onComplete: async (job) => {
        const { surveyId } = JobSerialized.getResult(job)
        dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
      },
    })
  )
}
