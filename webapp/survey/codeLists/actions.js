import axios from 'axios'
import * as R from 'ramda'

import { toUUIDIndexedObj } from '../../../common/survey/surveyUtils'
import { toQueryString } from '../../../server/serverUtils/request'

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
  assocCodeListLevelsValidation,
  dissocCodeListLevelValidation,
  assocCodeListItemsValidation,
  dissocCodeListItemValidation,
} from '../../../common/survey/codeList'
import {
  updateFieldValidation,
  getFieldValidation,
} from '../../../common/validation/validator'

import { getSurvey, getSurveyId } from '../surveyState'
import { debounceAction } from '../../appUtils/reduxUtils'
import {
  getCodeListEditActiveLevelItem,
  getCodeListEditCodeList,
  getCodeListEditLevelItemByUUID,
  getCodeListEditActiveItemAndAncestorsUUIDs,
} from './codeListsState'

import { dispatchMarkCurrentSurveyDraft } from '../actions'

export const codeListsUpdate = 'survey/codeLists/update'
export const codeListEditUpdate = 'survey/codeListEdit/update'
export const codeListEditLevelItemsUpdate = 'survey/codeListEdit/levelItems/update'
export const codeListEditActiveLevelItemUpdate = 'survey/codeListEdit/activeLevelItem/update'

const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatchCodeListsUpdate(dispatch, {[codeList.uuid]: codeList})

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
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const codeList = newCodeList()

  dispatchCodeListUpdate(dispatch, codeList)

  dispatchCodeListEditUpdate(dispatch, codeList.uuid)

  const surveyId = getSurveyId(getState())
  const res = await axios.post(`/api/survey/${surveyId}/codeLists`, codeList)

  const {codeList: addedCodeList} = res.data

  dispatchCodeListUpdate(dispatch, addedCodeList)
}

export const createCodeListLevel = () => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)

  const codeList = getCodeListEditCodeList(survey)
  const level = newCodeListLevel(codeList)
  const updatedCodeList = assocCodeListLevel(level)(codeList)

  dispatchCodeListUpdate(dispatch, updatedCodeList)

  const res = await axios.post(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels`, level)
  const {level: addedLevel, itemsValidation} = res.data

  dispatchCodeListUpdate(dispatch,
    R.pipe(
      assocCodeListLevel(addedLevel),
      assocCodeListItemsValidation(itemsValidation),
    )(updatedCodeList)
  )
}

export const createCodeListItem = (level) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const parentItem = getCodeListEditActiveLevelItem(level.index - 1)(survey)
  const item = newCodeListItem(level.id, getCodeListItemId(parentItem))

  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[item.uuid]: item})

  setCodeListItemForEdit(item, true)(dispatch, getState)

  //save item
  const res = await axios.post(`/api/survey/${surveyId}/codeLists/${codeList.id}/items`, item)
  const {item: insertedItem, itemsValidation} = res.data

  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[insertedItem.uuid]: insertedItem})

  //update items validation
  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(itemsValidation)(codeList))
}

// ==== READ

export const fetchCodeLists = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/codeLists?draft=${draft}`)

    dispatchCodeListsUpdate(dispatch, data.codeLists)
  } catch (e) { }
}

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
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)

  const codeList = R.pipe(
    getCodeListEditCodeList,
    assocCodeListProp(key, value),
    R.dissocPath(['validation', 'fields', key]),
  )(survey)

  dispatchCodeListUpdate(dispatch, codeList)

  const action = async () => {
    try {
      const {data} = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}`, {key, value})
      const {codeLists} = data

      dispatchCodeListsUpdate(dispatch, toUUIDIndexedObj(codeLists))
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${codeListsUpdate}_${codeList.uuid}`))
}

export const putCodeListLevelProp = (codeListId, levelIndex, key, value) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)

  const codeList = R.pipe(
    getCodeListEditCodeList,
    assocCodeListLevelProp(levelIndex, key, value),
    dissocCodeListLevelValidation(levelIndex),
  )(survey)

  dispatchCodeListUpdate(dispatch, codeList)

  const level = getCodeListLevelByIndex(levelIndex)(codeList)
  const action = async () => {
    try {
      const {data} = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`, {
        key,
        value
      })
      const {validation} = data
      dispatchCodeListUpdate(dispatch, assocCodeListLevelsValidation(validation)(codeList))
    } catch (e) {}
  }
  dispatch(debounceAction(action, `codeListLevel_${level.uuid}`))

}

export const putCodeListItemProp = (levelIndex, itemUUID, key, value) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)

  //update item in code list edit state
  const item = R.pipe(
    getCodeListEditLevelItemByUUID(levelIndex, itemUUID),
    assocCodeListItemProp(key, value),
  )(survey)

  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, {[itemUUID]: item})

  //dissoc item validation
  const ancestorItemsAndSelfUUIDs = getCodeListEditActiveItemAndAncestorsUUIDs(levelIndex)(survey)
  dispatchCodeListUpdate(dispatch, dissocCodeListItemValidation(ancestorItemsAndSelfUUIDs)(codeList))

  const action = async () => {
    try {
      const {data} = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`, {key, value})
      const {itemsValidation} = data
      dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(itemsValidation)(codeList))
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${codeListEditLevelItemsUpdate}_${itemUUID}`))
}

// ==== DELETE

export const deleteCodeList = codeList => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const surveyId = getSurveyId(getState())

  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: null}})

  //delete code list and items from db
  await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = levelIndex => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  dispatchCodeListEditActiveLevelItemUpdate(dispatch, levelIndex, null)
  dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, null)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelByIndex(levelIndex)(codeList)

  const updatedCodeList = dissocCodeListLevel(levelIndex)(codeList)
  dispatchCodeListUpdate(dispatch, updatedCodeList)

  //delete level and items from db
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`)

  const {itemsValidation} = data
  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(itemsValidation)(updatedCodeList))
}

export const deleteCodeListItem = item => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  //delete item validation
  const ancestorItemsUUIDs = getCodeListEditActiveItemAndAncestorsUUIDs(level.index)(survey)
  dissocCodeListItemValidation(ancestorItemsUUIDs)(codeList)
  //reset selected level item
  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, null)
  //reset next level items
  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index + 1, null)
  //update current level items
  dispatchCodeListEditLevelItemsUpdate(dispatch, level.index, {[item.uuid]: null})

  //delete item from db
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`)

  //update items validation
  const {itemsValidation} = data
  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(itemsValidation)(codeList))
}

// ==== OPEN / CLOSE EDITOR

export const setCodeListForEdit = (codeList) => async (dispatch, getState) => {
  const surveyId = getSurveyId(getState())

  dispatchCodeListEditUpdate(dispatch, codeList ? codeList.uuid : null)

  //load first level items
  if (codeList)
    await loadCodeListLevelItems(dispatch, surveyId, codeList.id)
}

export const setCodeListItemForEdit = (item, edit = true) => async (dispatch, getState) => {
  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatchCodeListEditActiveLevelItemUpdate(dispatch, level.index, edit ? item.uuid : null)

  //load child items
  await loadCodeListLevelItems(dispatch, surveyId, codeList.id, level.index + 1, getCodeListItemId(item))
}