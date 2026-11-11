import axios from 'axios'

import { ServiceErrorActions } from '@webapp/store/system/serviceError'
import { NotificationActions } from '@webapp/store/ui/notification'

import { surveyCreate, surveyUpdate } from './actionTypes'

const dataMigrationInProgressErrorKey = 'survey.dataMigrationInProgress'

const fetchSurvey = async ({ surveyId, canEdit }) => {
  const params = { draft: canEdit, validate: canEdit }
  // errors handled locally: a survey being upgraded is notified as a warning
  const { data } = await axios.get(`/api/survey/${surveyId}`, { params, errorHandledLocally: true })
  return data.survey
}

export const setActiveSurvey =
  (surveyId, canEdit = true, dispatchSurveyCreate = false) =>
  async (dispatch) => {
    let survey
    try {
      survey = await fetchSurvey({ surveyId, canEdit })
    } catch (error) {
      const { key, params } = error.response?.data ?? {}
      if (key === dataMigrationInProgressErrorKey) {
        // temporarily unavailable: keep the current survey active
        dispatch(NotificationActions.notifyWarning({ key: `appErrors:${key}`, params }))
        return
      }
      dispatch(ServiceErrorActions.createServiceError({ error }))
      throw error
    }
    dispatch({ type: dispatchSurveyCreate ? surveyCreate : surveyUpdate, survey })
  }
