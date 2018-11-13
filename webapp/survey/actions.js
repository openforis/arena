import axios from 'axios'

import { getStateSurveyId } from './surveyState'
import { getUser } from '../app/appState'
import { userPrefNames } from '../../common/user/userPrefs'
import { appUserPrefUpdate } from '../app/actions'
import { showAppJobMonitor } from '../appModules/appView/components/job/actions'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyPublish = 'survey/publish'
export const surveyDefsLoad = 'survey/defs/load'

const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyUpdate, survey})

const fetchNodeDefs = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/nodeDefs?draft=${draft}&validate=${validate}`)

const fetchCodeLists = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/codeLists?draft=${draft}&validate=${validate}`)

const fetchTaxonomies = (surveyId, draft = false, validate = false) =>
  axios.get(`/api/survey/${surveyId}/taxonomies?draft=${draft}&validate=${validate}`)

export const initSurveyDefs = (draft = false, validate = false) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())

  const res = await Promise.all([
    fetchNodeDefs(surveyId, draft, validate),
    fetchCodeLists(surveyId, draft, validate),
    fetchTaxonomies(surveyId, draft, validate),
  ])

  dispatch({
    type: surveyDefsLoad,
    nodeDefs: res[0].data.nodeDefs,
    codeLists: res[1].data.codeLists,
    taxonomies: res[2].data.taxonomies
  })

}

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

  const {data} = await axios.put(`/api/survey/${surveyId}/publish`)

  /*
  dispatch(showAppJobMonitor(data.job, () => {
    //publish job complete
    dispatch({type: surveyPublish})
  }))
  */
}

// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}`)

  dispatchCurrentSurveyUpdate(dispatch, null)
}

