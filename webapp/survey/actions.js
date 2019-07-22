import axios from 'axios'

import * as SurveyState from './surveyState'
import * as AppState from '../app/appState'
import { userPrefNames } from '../../common/user/userPrefs'
import { appUserPrefUpdate, showAppJobMonitor } from '../app/actions'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyDelete = 'survey/delete'
export const surveyDefsLoad = 'survey/defs/load'

const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({ type: surveyUpdate, survey })

const fetchNodeDefs = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/nodeDefs?draft=${draft}&validate=${validate}`)

const fetchCategories = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/categories?draft=${draft}&validate=${validate}`)

const fetchTaxonomies = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/taxonomies?draft=${draft}&validate=${validate}`)

export const initSurveyDefs = (draft = false, validate = false) => async (dispatch, getState) => {
  const state = getState()

  if (
    !SurveyState.areDefsFetched(state) ||
    (SurveyState.areDefsDraftFetched(state) !== draft)
  ) {

    const surveyId = SurveyState.getSurveyId(state)

    const res = await Promise.all([
      fetchNodeDefs(surveyId, draft, validate),
      fetchCategories(surveyId, draft, validate),
      fetchTaxonomies(surveyId, draft, validate),
    ])

    dispatch({
      type: surveyDefsLoad,
      nodeDefs: res[0].data.nodeDefs,
      categories: res[1].data.categories,
      taxonomies: res[2].data.taxonomies,
      draft
    })
  }

}

// ====== SET ACTIVE SURVEY
export const setActiveSurvey = (surveyId, draft = true) =>
  async (dispatch, getState) => {
    //load survey
    const { data } = await axios.get(`/api/survey/${surveyId}?draft=${draft}`)
    dispatchCurrentSurveyUpdate(dispatch, data.survey)

    //update userPref
    const user = AppState.getUser(getState())
    await axios.post(`/api/user/${user.id}/pref/${userPrefNames.survey}/${surveyId}`)
    dispatch({ type: appUserPrefUpdate, name: userPrefNames.survey, value: surveyId })
  }

// ==== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.put(`/api/survey/${surveyId}/publish`)

  dispatch(
    showAppJobMonitor(data.job, () => {
      dispatch(setActiveSurvey(surveyId, true))
    })
  )
}

// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}`)

  dispatch({ type: surveyDelete, surveyId })
}

