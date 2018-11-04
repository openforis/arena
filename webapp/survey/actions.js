import axios from 'axios'

import { getStateSurveyId } from './surveyState'
import { getUser } from '../app/appState'
import { userPrefNames } from '../../common/user/userPrefs'
import { appUserPrefUpdate } from '../app/actions'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyPublish = 'survey/publish'

const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyUpdate, survey})

// ====== SET ACTIVE SURVEY
export const setActiveSurvey = (surveyId, draft = true) =>
  async (dispatch, getState) => {
    //load survey
    const {data} = await axios.get(`/api/survey/${surveyId}?draft=${draft}`)
    dispatchCurrentSurveyUpdate(dispatch, data.survey)

    //update userPref
    const user = getUser(getState())
    await axios.post(`/api/user/${user.id}/pref/${userPrefNames.survey}/${surveyId}`)
    dispatch({type: appUserPrefUpdate, name: userPrefNames.survey, value: surveyId})

  }

// ==== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())

  dispatch({type: surveyPublish})

  await axios.put(`/api/survey/${surveyId}/publish`)
}

// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}`)

  dispatchCurrentSurveyUpdate(dispatch, null)
}

