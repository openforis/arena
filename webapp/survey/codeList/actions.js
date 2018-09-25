import axios from 'axios'
import * as R from 'ramda'

import { toUUIDIndexedObj } from '../../../common/survey/surveyUtils'
import { toQueryString } from '../../../server/serverUtils/request'

import { getSurveyCodeListByUUID, } from '../../../common/survey/survey'

import {
  assocCodeListItemProp,
  assocCodeListLevel,
  assocCodeListProp,
  dissocCodeListLevel,
  getCodeListItemId,
  getCodeListLevelById,
  getCodeListLevelByIndex,
  newCodeList,
  newCodeListItem,
  newCodeListLevel,
  assocCodeListLevelProp,
} from '../../../common/survey/codeList'

import { getSurvey } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import {
  getCodeListEditActiveLevelItem,
  getCodeListEditCodeList,
  getCodeListEditLevelItemByUUID,
} from './codeListEditorState'

export const codeListsUpdate = 'survey/codeLists/update'
export const codeListEditUpdate = 'survey/codeListEdit/update'
export const codeListEditLevelItemsUpdate = 'survey/codeListEdit/levelItems/update'
export const codeListEditActiveLevelItemUpdate = 'survey/codeListEdit/activeLevelItem/update'

const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: codeList}})

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

const loadCodeListLevelItems = async (dispatch, surveyId, codeListId, levelIndex = 0, parentId = null) => {

  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, null) //reset level items

  if (levelIndex === 0 || parentId) {
    const queryParams = {
      draft: true,
      parentId,
    }

    const {data} = await axios.get(`/api/survey/${surveyId}/codeLists/${codeListId}/items?${toQueryString(queryParams)}`)
    const {items} = data

    dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, toUUIDIndexedObj(items))
  }
}

// ==== UPDATE

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const codeList = R.pipe(
    getCodeListEditCodeList,
    assocCodeListProp(key, value)
  )(survey)

  dispatchCodeListUpdate(dispatch, codeList)

  const action = async () => {
    try {
      await axios.put(`/api/survey/${survey.id}/codeLists/${codeList.id}`, {codeList})
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${codeListsUpdate}_${codeList.uuid}`))

}

export const putCodeListLevelProp = (codeListId, levelIndex, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const codeList = R.pipe(
    getCodeListEditCodeList,
    assocCodeListLevelProp(levelIndex, key, value),
  )(survey)

  dispatchCodeListUpdate(dispatch, codeList)

  const level = getCodeListLevelByIndex(levelIndex)(codeList)
  const action = async () => {
    try {
      await axios.put(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels/${level.id}`, {level})
    } catch (e) {}
  }
  dispatch(debounceAction(action, `codeListLevel_${level.uuid}`))

}

export const putCodeListItemProp = (levelIndex, itemUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)

  const item = R.pipe(
    getCodeListEditLevelItemByUUID(levelIndex, itemUUID),
    assocCodeListItemProp(key, value),
  )(survey)

  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, {[itemUUID]: item})

  const action = async () => {
    try {
      await axios.put(`/api/survey/${survey.id}/codeLists/${codeList.id}/items/${item.id}`, {item})
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${codeListEditLevelItemsUpdate}_${itemUUID}`))
}

// ==== DELETE

export const deleteCodeList = codeList => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: null}})

  //delete code list and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = levelIndex => async (dispatch, getState) => {
  dispatchCodeListEditActiveLevelItemUpdate(dispatch, levelIndex, null)
  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, null)

  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelByIndex(levelIndex)(codeList)

  const updatedCodeList = dissocCodeListLevel(levelIndex)(codeList)
  dispatchCodeListUpdate(dispatch, updatedCodeList)

  //delete level and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels/${level.id}`)
}

export const deleteCodeListItem = item => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  //reset selected level item
  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, null)
  //reset next level items
  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index + 1, null)
  //update current level items
  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[item.uuid]: null})

  //delete item from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}/items/${item.id}`)
}

// ==== OPEN / CLOSE EDITOR

export const setCodeListForEdit = (codeList) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  dispatchCodeListEditUpdate(dispatch, codeList ? codeList.uuid : null)

  //load first level items
  await loadCodeListLevelItems(dispatch, survey.id, codeList.id)
}

export const setCodeListItemForEdit = (item, edit = true) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, edit ? item.uuid : null)

  //load child items
  await loadCodeListLevelItems(dispatch, survey.id, codeList.id, level.index + 1, getCodeListItemId(item))
}