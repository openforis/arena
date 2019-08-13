import axios from 'axios'

import Survey from '../../common/survey/survey'

import * as SurveyState from './surveyState'
import * as AppState from '../app/appState'

import User from '../../common/user/user'
import { userPrefNames } from '../../common/user/userPrefs'

import { appUserPrefUpdate, showAppJobMonitor, showNotificationMessage } from '../app/actions'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyDelete = 'survey/delete'
export const surveyDefsLoad = 'survey/defs/load'

const fetchDefs = (surveyId, defs, draft = false, validate = false) =>
  axios.get(
    `/api/survey/${surveyId}/${defs}`,
    { params: { draft, validate } }
  )

export const initSurveyDefs = (draft = false, validate = false) => async (dispatch, getState) => {
  const state = getState()

  if (!SurveyState.areDefsFetched(draft)(state)) {

    const surveyId = SurveyState.getSurveyId(state)

    const [
      { data: { nodeDefs, nodeDefsValidation } },
      { data: { categories } },
      { data: { taxonomies } }
    ] = await Promise.all([
      fetchDefs(surveyId, 'nodeDefs', draft, validate),
      fetchDefs(surveyId, 'categories', draft, validate),
      fetchDefs(surveyId, 'taxonomies', draft, validate),
    ])

    dispatch({ type: surveyDefsLoad, nodeDefs, nodeDefsValidation, categories, taxonomies, draft })
  }

}

// ====== SET ACTIVE SURVEY
export const setActiveSurvey = (surveyId, canEdit = true) =>
  async (dispatch, getState) => {
    //load survey
    const params = { draft: canEdit, validate: canEdit }
    const { data: { survey } } = await axios.get(`/api/survey/${surveyId}`, { params })
    dispatch({ type: surveyUpdate, survey })

    //update userPref
    const user = AppState.getUser(getState())
    await axios.post(`/api/user/${User.getUuid(user)}/pref/${userPrefNames.survey}/${surveyId}`)
    dispatch({ type: appUserPrefUpdate, name: userPrefNames.survey, value: surveyId })
  }

// ====== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.put(`/api/survey/${surveyId}/publish`)

  dispatch(
    showAppJobMonitor(data.job, () => {
      dispatch(setActiveSurvey(surveyId, true))
    })
  )
}

// ====== DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  await axios.delete(`/api/survey/${surveyId}`)

  dispatch({ type: surveyDelete, surveyId })
  dispatch(showNotificationMessage('homeView.surveyDeleted', { surveyName: Survey.getName(surveyInfo) }))
}

