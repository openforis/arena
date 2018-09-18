import axios from 'axios'
import * as R from 'ramda'

import {
  newCodeList,
  newCodeListLevel,
  newCodeListItem,
  getCodeListLevels,
  getCodeListLevelById,
  getCodeListLevelByUUID,
  getCodeListItemByUUID,
  assocCodeListProp,
  assocCodeListLevelProp,
  assocCodeListItemProp,
} from '../../../common/survey/codeList'

import { getSurvey } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import { getCodeListsEditorEditedCodeList, getCodeListsEditorSelectedItemByLevelIndex } from './codeListsEditorState'

export const codeListsUpdate = 'survey/codeLists/update'
export const codeListEditorLevelUpdate = 'survey/codeLists/level/update'
export const codeListsEditorItemUpdate = 'survey/codeLists/item/update'
export const codeListsEditorCodeListUpdate = 'survey/codeListsEditor/editedCodeList/update'
export const codeListsEditorItemSelect = 'survey/codeListsEditor/editedItem/select'
export const codeListsEditorItemReset = 'survey/codeListsEditor/editedItem/reset'

const dispatchCodeListUpdate = (dispatch, codeList) => {
  dispatchCodeListsUpdate(dispatch, {[codeList.uuid]: codeList})
  dispatchEditedCodeListUpdate(dispatch, codeList)
}

const dispatchEditedCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListsEditorCodeListUpdate, codeList})

const dispatchCodeListsUpdate = (dispatch, codeLists) =>
  dispatch({type: codeListsUpdate, codeLists})

const dispatchCodeListLevelUpdate = (dispatch, level) =>
  dispatch({type: codeListEditorLevelUpdate, level})

const dispatchCodeListItemUpdate = (dispatch, item) =>
  dispatch({type: codeListsEditorItemUpdate, item})

// ==== CREATE

export const createCodeList = () => async (dispatch, getState) => {
  const codeList = newCodeList()

  dispatchCodeListUpdate(dispatch, codeList)

  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/codeLists`, codeList)

  const {codeList: addedCodeList} = res.data

  dispatchCodeListUpdate(dispatch, addedCodeList)
}

export const editCodeList = codeListId => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const res = await axios.get(`/api/survey/${survey.id}/codeLists/${codeListId}`)

  const {codeList} = res.data

  dispatchEditedCodeListUpdate(dispatch, codeList)
}

export const deleteCodeList = () => dispatch => {
  //TODO
}

export const createCodeListLevel = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const codeList = getCodeListsEditorEditedCodeList(survey)
  const levels = getCodeListLevels(codeList)
  const level = newCodeListLevel(codeList.id, levels.length) //add new level to the end

  dispatchCodeListLevelUpdate(dispatch, level)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${level.codeListId}/levels`, level)

  const {level: addedLevel} = res.data

  dispatchCodeListLevelUpdate(dispatch, addedLevel)
}

export const createCodeListItem = (level) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)
  const parentItem = getCodeListsEditorSelectedItemByLevelIndex(level.index - 1)(survey)

  const item = newCodeListItem(level.id, R.propOr(null, 'id', parentItem))

  dispatchCodeListItemUpdate(dispatch, item)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels/${level.id}/items`, item)

  const {item: addedItem} = res.data

  dispatchCodeListItemUpdate(dispatch, addedItem)
}

// ==== UPDATE

export const openCodeListItemEditor = item => (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatch({type: codeListsEditorItemSelect, level, item})
}

export const closeCodeListItemEditor = item => (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatch({type: codeListsEditorItemReset, level})
}

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const updatedCodeList = R.pipe(
    assocCodeListProp(key, value),
    //assocCodeListPropValidation(key, null)
  )(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)
  dispatch(_putCodeList(survey.id, codeList))
}

const _putCodeList = (surveyId, codeList) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}`, {codeList})
      const {reloadedCodeList} = res.data

      //TODO reloaded code list does not include levels...
      //dispatchCodeListUpdate(dispatch, reloadedCodeList)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListsUpdate}_${codeList.uuid}`)
}

export const putCodeListLevelProp = (codeListId, codeListLevelUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const level = getCodeListLevelByUUID(codeListLevelUUID)(codeList)

  const updatedLevel = assocCodeListLevelProp(key, value)(level)

  dispatchCodeListLevelUpdate(dispatch, updatedLevel)
  dispatch(_putCodeListLevel(survey.id, codeList, updatedLevel))
}

const _putCodeListLevel = (surveyId, codeList, level) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`, {level})
      const {reloadedLevel} = res.data

      dispatchCodeListLevelUpdate(dispatch, reloadedLevel)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListEditorLevelUpdate}_${level.uuid}`)
}

export const putCodeListItemProp = (level, itemUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const item = getCodeListItemByUUID(itemUUID)(codeList)
  const updatedItem = assocCodeListItemProp(key, value)(item)

  dispatchCodeListItemUpdate(dispatch, updatedItem)
  dispatch(_putCodeListItem(survey.id, codeList, updatedItem))
}

const _putCodeListItem = (surveyId, codeList, item) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`, {item})
      const {reloadedItem} = res.data

      dispatchCodeListItemUpdate(dispatch, reloadedItem)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListsEditorItemUpdate}_${item.uuid}`)
}

