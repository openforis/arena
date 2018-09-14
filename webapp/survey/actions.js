import axios from 'axios'
import * as R from 'ramda'

import { assocSurveyProp, assocSurveyPropValidation, getSurveyCodeListByUUID, getSurveyCodeListById } from '../../common/survey/survey'
import { assocCodeListProp } from '../../common/survey/codeList'

import { getSurvey, getSurveyId, getNewSurvey } from './surveyState'
import { nodeDefUpdate } from './nodeDef/actions'
import { debounceAction } from '../appUtils/reduxUtils'

export const surveyCurrentUpdate = 'survey/current/update'
export const surveyNewUpdate = 'survey/new/update'

//CODE LISTS
export const codeListsUpdate = 'survey/codeLists/update'
export const codeListLevelUpdate = 'survey/codeLists/level/update'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentUpdate, survey})

const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: codeList}})

const dispatchCodeListLevelUpdate = (dispatch, codeList, level) =>
  dispatch({type: codeListLevelUpdate, codeList, level})

// ====== CREATE

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({type: surveyNewUpdate, newSurvey})

}

export const createSurvey = surveyProps => async (dispatch, getState) => {
  try {
    const {data} = await axios.post('/api/survey', surveyProps)

    const {survey} = data
    const valid = !!survey

    if (valid) {
      dispatchCurrentSurveyUpdate(dispatch, survey)
      dispatch(resetNewSurvey())
    } else {
      dispatch({
        type: surveyNewUpdate,
        newSurvey: {
          ...getNewSurvey(getState()),
          ...data,
        }
      })

    }

  } catch (e) {

  }
}

export const resetNewSurvey = () => dispatch => dispatch({type: surveyNewUpdate, newSurvey: null})

// ==== READ

export const fetchRootNodeDef = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/rootNodeDef?draft=${draft}`)
    dispatch({type: nodeDefUpdate, ...data})

  } catch (e) { }
}

// ==== UPDATE

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getSurvey,
    assocSurveyProp(key, value),
    assocSurveyPropValidation(key, null)
  )(getState())

  dispatchCurrentSurveyUpdate(dispatch, survey)
  dispatch(_updateSurveyProp(survey, key, value))
}

const _updateSurveyProp = (survey, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${survey.id}/prop`, {key, value})

      const {validation} = res.data

      const updatedSurvey = assocSurveyPropValidation(key, validation)(survey)

      dispatchCurrentSurveyUpdate(dispatch, updatedSurvey)
    } catch (e) {}
  }

  return debounceAction(action, `${surveyCurrentUpdate}_${key}`)
}

// ==== CODE LISTS

// ==== CREATE

export const addCodeList = (codeList) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/codeLists`, codeList)

  const {codeList: addedCodeList} = res.data

  dispatchCodeListUpdate(dispatch, addedCodeList)
}

export const addCodeListLevel = (level) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const res = await axios.post(`/api/survey/${survey.id}/codeList/${level.codeListId}/level`, level)

  const {level: addedLevel} = res.data

  const codeList = getSurveyCodeListById(level.codeListId)

  dispatchCodeListLevelUpdate(dispatch, codeList, addedLevel)
}



// ==== UPDATE

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {

  const codeList = R.pipe(
    getSurvey,
    getSurveyCodeListByUUID(codeListUUID),
  )(getState())

  const updatedCodeList = R.pipe(
    assocCodeListProp(key, value),
    //assocCodeListPropValidation(key, null)
  )(codeList)

  //TODO apply changes to DB

  dispatchCodeListUpdate(dispatch, updatedCodeList)
}