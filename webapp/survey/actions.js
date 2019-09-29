import axios from 'axios'

import Survey from '../../common/survey/survey'

import * as SurveyState from './surveyState'

import { showAppJobMonitor, showNotificationMessage } from '../app/actions'

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
export const setActiveSurvey = (surveyId, canEdit = true) => async dispatch => {
  //load survey
  const params = { draft: canEdit, validate: canEdit }
  const { data: { survey } } = await axios.get(`/api/survey/${surveyId}`, { params })
  dispatch({ type: surveyUpdate, survey })
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

  dispatch({ type: surveyDelete, surveyInfo })
  dispatch(showNotificationMessage('homeView.surveyDeleted', { surveyName: Survey.getName(surveyInfo) }))
}

