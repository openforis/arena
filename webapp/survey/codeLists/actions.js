import axios from 'axios'

import { getStateSurveyId } from '../surveyState'

export const codeListsUpdate = 'survey/codeLists/update'

// ==== READ

export const fetchCodeLists = (draft = false) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.get(`/api/survey/${surveyId}/codeLists?draft=${draft}`)

  dispatch({type: codeListsUpdate, codeLists: data.codeLists})
}
