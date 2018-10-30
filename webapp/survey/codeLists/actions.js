import axios from 'axios'
import { getStateSurveyId } from '../surveyState'

export const codeListsUpdate = 'survey/codeLists/update'

export const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatchCodeListsUpdate(dispatch, {[codeList.uuid]: codeList})

export const dispatchCodeListsUpdate = (dispatch, codeLists) =>
  dispatch({type: codeListsUpdate, codeLists})


// ==== READ

export const fetchCodeLists = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/codeLists?draft=${draft}`)

    dispatchCodeListsUpdate(dispatch, data.codeLists)
  } catch (e) { }
}
