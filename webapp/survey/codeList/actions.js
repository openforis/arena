import axios from 'axios'
import * as R from 'ramda'

import {toUUIDIndexedObj} from '../../../common/survey/surveyUtils'
import {toQueryString} from '../../../server/serverUtils/request'

import {
  newCodeList,
  newCodeListLevel,
  newCodeListItem,
  getCodeListItemId,
  getCodeListLevelById,
  getCodeListLevelByUUID,
  assocCodeListProp,
  assocCodeListLevelProp,
  assocCodeListItemProp,
  assocCodeListLevel,
  dissocCodeListLevel,
} from '../../../common/survey/codeList'

import { getSurvey } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import {
  getCodeListByUUID,
  getCodeListEditCodeList,
  getCodeListEditActiveLevelItem,
  getCodeListEditLevelItemByUUID,
} from './codeListEditorState'

export const codeListsUpdate = 'survey/codeLists/update'
export const codeListEditUpdate = 'survey/codeListEdit/update'
export const codeListEditLevelItemsUpdate = 'survey/codeListEdit/levelItems/update'
export const codeListEditActiveLevelItemUpdate = 'survey/codeListEdit/activeLevelItem/update'

const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: codeList}})

const dispatchCodeListsUpdate = (dispatch, codeLists) =>
  dispatch({type: codeListsUpdate, codeLists})

const dispatchCodeListEditUpdate = (dispatch, codeListUUID) =>
  dispatch({type: codeListEditUpdate, codeListUUID})

const dispatchCodeListEditLevelItemsUpdate = (dispatch, levelIndex, items) =>
  dispatch({type: codeListEditLevelItemsUpdate, levelIndex, items})

const dispatchCodeListEditActiveLevelItemUpdate = (dispatch, levelIndex, itemUUID) =>
  dispatch({type: codeListEditActiveLevelItemUpdate, levelIndex, itemUUID})

// ==== CREATE

export const createCodeList = () => async (dispatch, getState) => {
  const codeList = newCodeList()

  dispatchCodeListUpdate(dispatch, codeList)

  dispatchCodeListEditUpdate(dispatch, codeList.uuid)

  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/codeLists`, codeList)

  const {codeList: addedCodeList} = res.data

  dispatchCodeListUpdate(dispatch, addedCodeList)
}

export const createCodeListLevel = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const codeList = getCodeListEditCodeList(survey)
  const level = newCodeListLevel(codeList)
  const updatedCodeList = assocCodeListLevel(level)(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels`, level)
  const {level: addedLevel} = res.data
  const reloadedCodeList = assocCodeListLevel(addedLevel)(codeList)
  dispatchCodeListUpdate(dispatch, reloadedCodeList)
}

export const createCodeListItem = (level) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const parentItem = getCodeListEditActiveLevelItem(level.index - 1)(survey)
  const item = newCodeListItem(level.id, getCodeListItemId(parentItem))

  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[item.uuid]: item})

  setCodeListItemForEdit(item, true)(dispatch, getState)

  //save item
  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${codeList.id}/items`, item)
  const {item: insertedItem} = res.data

  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[insertedItem.uuid]: insertedItem})
}

// ==== READ

const loadCodeListLevelItems = async (surveyId, codeListId, levelIndex, parentId, dispatch) => {
  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, []) //reset level items

  const queryParams = {
    draft: true,
    parentId,
  }

  const res = await axios.get(`/api/survey/${surveyId}/codeLists/${codeListId}/items?${toQueryString(queryParams)}`)
  const {items} = res.data

  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, toUUIDIndexedObj(items))
}

// ==== UPDATE

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)

  const updatedCodeList = R.pipe(
    assocCodeListProp(key, value),
    //assocCodeListPropValidation(key, null)
  )(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)
  dispatch(_putCodeList(survey.id, updatedCodeList))
}

const _putCodeList = (surveyId, codeList) => {
  const action = async () => {
    try {
      await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}`, {codeList})
      //TODO reloaded code list does not include levels, dispatch update action?
      //const {reloadedCodeList} = res.data
      //dispatchCodeListUpdate(dispatch, reloadedCodeList)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListsUpdate}_${codeList.uuid}`)
}

export const putCodeListLevelProp = (codeListId, codeListLevelUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelByUUID(codeListLevelUUID)(codeList)

  const updatedLevel = assocCodeListLevelProp(key, value)(level)
  const updatedCodeList = assocCodeListLevel(updatedLevel)(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)

  dispatch(_putCodeListLevel(survey.id, updatedLevel))
}

const _putCodeListLevel = (surveyId, codeList, level) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`, {level})
      const {reloadedLevel} = res.data

      const updatedCodeList = assocCodeListLevel(reloadedLevel)(codeList)
      dispatchCodeListUpdate(dispatch, updatedCodeList)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListsUpdate}_${level.uuid}`)
}

export const putCodeListItemProp = (levelIndex, itemUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const item = getCodeListEditLevelItemByUUID(levelIndex, itemUUID)(survey)
  const updatedItem = assocCodeListItemProp(key, value)(item)

  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, {[updatedItem.uuid]: updatedItem})
  dispatch(_putCodeListItem(survey.id, codeList.id, levelIndex, updatedItem))
}

const _putCodeListItem = (surveyId, codeListId, levelIndex, item) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeListId}/items/${item.id}`, {item})
      const {reloadedItem: updatedItem} = res.data

      dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, {[updatedItem.uuid]: updatedItem})
    } catch (e) {}
  }
  return debounceAction(action, `${codeListEditLevelItemsUpdate}_${item.uuid}`)
}

// ==== DELETE

export const deleteCodeList = codeListUUID => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListByUUID(codeListUUID)(survey)

  //remove code list  from code list manager state
  dispatchCodeListsUpdate(dispatch, {[codeListUUID]: null})

  //delete code list and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = levelUUID => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelByUUID(levelUUID)(codeList)

  const updatedCodeList = dissocCodeListLevel(codeList)
  dispatchCodeListUpdate(dispatch, updatedCodeList)

  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, [])
  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, null)

  //delete level and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels/${level.id}`)
}

// ==== OPEN / CLOSE EDITOR

export const setCodeListForEdit = (codeListId, edit = true) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const res = await axios.get(`/api/survey/${survey.id}/codeLists/${codeListId}?draft=true`)

  const {codeList} = res.data

  dispatchCodeListUpdate(dispatch, codeList)

  dispatchCodeListEditUpdate(dispatch, edit ? codeList.uuid : null)

  //load first level items
  await loadCodeListLevelItems(survey.id, codeList.id, 0, null, dispatch)
}

export const setCodeListItemForEdit = (item, edit = true) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, edit ? item.uuid : null)

  //load child items
  await loadCodeListLevelItems(survey.id, codeList.id, level.index + 1, item.id, dispatch)
}