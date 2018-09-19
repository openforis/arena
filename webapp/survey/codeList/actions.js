import axios from 'axios'
import * as R from 'ramda'

import {toQueryString} from '../../../server/serverUtils/request'

import {
  newCodeList,
  newCodeListLevel,
  newCodeListItem,
  getCodeListItemId,
  getCodeListLevelsArray,
  getCodeListLevelById,
  getCodeListLevelByUUID,
  assocCodeListProp,
  assocCodeListLevelProp,
  assocCodeListItemProp,
} from '../../../common/survey/codeList'

import { getSurvey } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import {
  getCodeListByUUID,
  getCodeListEditorCodeList,
  getCodeListEditorActiveLevelItem,
  getCodeListEditorLevelItemByUUID
} from './codeListEditorState'

export const codeListsUpdate = 'survey/codeLists/update'

export const codeListEditorLevelUpdate = 'survey/codeListEditor/level/update'
export const codeListEditorItemUpdate = 'survey/codeListEditor/item/update'
export const codeListEditorCodeListUpdate = 'survey/codeListEditor/codeList/update'
export const codeListEditorItemSelect = 'survey/codeListEditor/activeItem/select'
export const codeListEditorItemReset = 'survey/codeListEditor/activeItem/reset'
export const codeListEditorLevelItemsUpdate = 'survey/codeListEditor/level/items/update'
export const codeListEditorListDelete = 'survey/codeListEditor/list/delete'
export const codeListEditorLevelDelete = 'survey/codeListEditor/level/delete'

const dispatchCodeListUpdate = (dispatch, codeList) => {
  dispatchCodeListsUpdate(dispatch, {[codeList.uuid]: codeList})
  dispatchEditedCodeListUpdate(dispatch, codeList.uuid)
}

const dispatchEditedCodeListUpdate = (dispatch, codeListUUID) =>
  dispatch({type: codeListEditorCodeListUpdate, codeListUUID})

const dispatchCodeListsUpdate = (dispatch, codeLists) =>
  dispatch({type: codeListsUpdate, codeLists})

const dispatchCodeListLevelUpdate = (dispatch, level) =>
  dispatch({type: codeListEditorLevelUpdate, level})

const dispatchCodeListItemUpdate = (dispatch, item) =>
  dispatch({type: codeListEditorItemUpdate, item})

const dispatchCodeListEditorLevelItemReset = (dispatch, levelIndex) =>
  dispatch({type: codeListEditorItemReset, levelIndex})

// ==== CREATE

export const createCodeList = () => async (dispatch, getState) => {
  const codeList = newCodeList()

  dispatchCodeListUpdate(dispatch, codeList)

  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/codeLists`, codeList)

  const {codeList: addedCodeList} = res.data

  dispatchCodeListUpdate(dispatch, addedCodeList)
}

export const createCodeListLevel = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const codeList = getCodeListEditorCodeList(survey)
  const levels = getCodeListLevelsArray(codeList)
  const level = newCodeListLevel(codeList.id, levels.length) //add new level to the end

  dispatchCodeListLevelUpdate(dispatch, level)

  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${level.codeListId}/levels`, level)

  const {level: addedLevel} = res.data

  dispatchCodeListLevelUpdate(dispatch, addedLevel)
}

export const createCodeListItem = (level) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)
  const parentItem = getCodeListEditorActiveLevelItem(level.index - 1)(survey)

  const item = newCodeListItem(level.id, getCodeListItemId(parentItem))

  dispatchCodeListItemUpdate(dispatch, item)

  openCodeListItemEditor(item)(dispatch, getState)

  //save item
  const res = await axios.post(`/api/survey/${survey.id}/codeLists/${codeList.id}/items`, item)

  const {item: addedItem} = res.data

  dispatchCodeListItemUpdate(dispatch, addedItem)
}

// ==== READ

const loadCodeListLevelItems = async (surveyId, codeListId, levelIndex, parentId, dispatch) => {
  dispatch({type: codeListEditorLevelItemsUpdate, levelIndex, items: []}) //reset level items

  const queryParams = {
    draft: true,
    parentId,
  }

  const res = await axios.get(`/api/survey/${surveyId}/codeLists/${codeListId}/items?${toQueryString(queryParams)}`)
  const {items} = res.data

  dispatch({type: codeListEditorLevelItemsUpdate, levelIndex: levelIndex, items})
}

// ==== UPDATE

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)

  const updatedCodeList = R.pipe(
    assocCodeListProp(key, value),
    //assocCodeListPropValidation(key, null)
  )(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)
  dispatch(_putCodeList(survey.id, updatedCodeList))
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
  const codeList = getCodeListEditorCodeList(survey)

  const level = getCodeListLevelByUUID(codeListLevelUUID)(codeList)

  const updatedLevel = assocCodeListLevelProp(key, value)(level)

  dispatchCodeListLevelUpdate(dispatch, updatedLevel)
  dispatch(_putCodeListLevel(survey.id, updatedLevel))
}

const _putCodeListLevel = (surveyId, level) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${level.codeListId}/levels/${level.id}`, {level})
      const {reloadedLevel} = res.data

      dispatchCodeListLevelUpdate(dispatch, reloadedLevel)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListEditorLevelUpdate}_${level.uuid}`)
}

export const putCodeListItemProp = (level, itemUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)
  const item = getCodeListEditorLevelItemByUUID(level.index, itemUUID)(survey)
  const updatedItem = assocCodeListItemProp(key, value)(item)

  dispatchCodeListItemUpdate(dispatch, updatedItem)
  dispatch(_putCodeListItem(survey.id, codeList.id, updatedItem))
}

const _putCodeListItem = (surveyId, codeListId, item) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${surveyId}/codeLists/${codeListId}/items/${item.id}`, {item})
      const {reloadedItem} = res.data

      dispatchCodeListItemUpdate(dispatch, reloadedItem)
    } catch (e) {}
  }
  return debounceAction(action, `${codeListEditorItemUpdate}_${item.uuid}`)
}

// ==== DELETE

export const deleteCodeList = codeListUUID => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListByUUID(codeListUUID)(survey)

  //remove code list  from code list manager state
  dispatch({type: codeListEditorListDelete, codeListUUID})

  //delete code list and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = levelUUID => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)
  const level = getCodeListLevelByUUID(levelUUID)(codeList)

  //remove level items from code list manager state
  dispatchCodeListEditorLevelItemReset(dispatch, level.index)

  dispatch({type: codeListEditorLevelDelete, levelIndex: level.index})

  //delete level and items from db
  await axios.delete(`/api/survey/${survey.id}/codeLists/${codeList.id}/levels/${level.id}`)
}


// ==== OPEN / CLOSE EDITOR

export const editCodeList = codeListId => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const res = await axios.get(`/api/survey/${survey.id}/codeLists/${codeListId}?draft=true`)

  const {codeList} = res.data

  dispatchCodeListUpdate(dispatch, codeList)

  dispatchEditedCodeListUpdate(dispatch, codeList.uuid)

  await loadCodeListLevelItems(survey.id, codeList.id, 0, null, dispatch)
}

export const openCodeListItemEditor = item => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatch({type: codeListEditorItemSelect, levelIndex: level.index, itemUUID: item.uuid})

  //load next level items
  await loadCodeListLevelItems(survey.id, codeList.id, level.index + 1, item.id, dispatch)
}

export const closeCodeListItemEditor = item => (dispatch, getState) => {
  const survey = getSurvey(getState())
  const codeList = getCodeListEditorCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatchCodeListEditorLevelItemReset(dispatch, level.index)
}
