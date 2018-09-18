import axios from 'axios'
import * as R from 'ramda'

import {
  newCodeList,
  getCodeListLevelById,
  getCodeListLevelByUUID,
  getCodeListItemByUUID,
  assocCodeListProp,
  assocCodeListLevelProp,
  assocCodeListItemProp,
} from '../../../common/survey/codeList'

import { getSurvey } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import { getCodeListsEditorEditedCodeList } from './codeListsEditorState'

export const codeListsUpdate = 'survey/codeLists/update'
export const codeListLevelUpdate = 'survey/codeLists/level/update'
export const codeListItemUpdate = 'survey/codeLists/item/update'
export const codeListsEditorEditedCodeListUpdate = 'survey/codeListsEditor/editedCodeList/update'
export const codeListsEditorItemSelect = 'survey/codeListsEditor/editedCodeList/editedItem/update'
export const codeListsEditorItemReset = 'survey/codeListsEditor/editedCodeList/editedItem/reset'

const dispatchCodeListUpdate = (dispatch, codeList) => {
  dispatchCodeListsUpdate(dispatch, {[codeList.uuid]: codeList})
  dispatchEditedCodeListUpdate(dispatch, codeList)
}

const dispatchEditedCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListsEditorEditedCodeListUpdate, codeList})

const dispatchCodeListsUpdate = (dispatch, codeLists) =>
  dispatch({type: codeListsUpdate, codeLists})

const dispatchCodeListLevelUpdate = (dispatch, level) =>
  dispatch({type: codeListLevelUpdate, level})

const dispatchCodeListItemUpdate = (dispatch, codeListUUID, item) =>
  dispatch({type: codeListItemUpdate, codeListUUID, item})

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

export const createCodeListLevel = (level) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  dispatchCodeListLevelUpdate(dispatch, level)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${level.codeListId}/levels`, level)

  const {level: addedLevel} = res.data

  dispatchCodeListLevelUpdate(dispatch, addedLevel)
}

export const createCodeListItem = (codeListId, item) => async (dispatch, getState) => {
  const {levelId} = item

  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const {uuid: codeListUUID} = codeList

  dispatchCodeListItemUpdate(dispatch, codeListUUID, item)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${codeListId}/levels/${levelId}/items`, item)

  const {item: addedItem} = res.data

  dispatchCodeListItemUpdate(dispatch, codeListUUID, addedItem)
}

// ==== UPDATE

export const editCodeListItem = item => (dispatch, getState) => {
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

      dispatchCodeListUpdate(dispatch, reloadedCodeList)
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
  return debounceAction(action, `${codeListLevelUpdate}_${level.uuid}`)
}

export const putCodeListItemProp = (level, itemUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const item = getCodeListItemByUUID(itemUUID)(codeList)
  const updatedItem = assocCodeListItemProp(key, value)(item)

  dispatchCodeListItemUpdate(dispatch, codeList.uuid, updatedItem)
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
  return debounceAction(action, `${codeListItemUpdate}_${item.uuid}`)
}

