import axios from 'axios'
import * as R from 'ramda'

import { toUUIDIndexedObj } from '../../../common/survey/surveyUtils'
import { dispatchMarkCurrentSurveyDraft } from '../actions'
import { getSurvey, getStateSurveyId } from '../surveyState'

import {
  assocCodeListItemProp,
  assocCodeListItemsValidation,
  assocCodeListLevel,
  assocCodeListLevelProp,
  assocCodeListLevelsValidation,
  assocCodeListProp,
  dissocCodeListItemValidation,
  dissocCodeListLevel,
  dissocCodeListLevelValidation,
  getCodeListItemId,
  getCodeListLevelById,
  getCodeListLevelByIndex,
  newCodeList,
  newCodeListItem,
  newCodeListLevel
} from '../../../common/survey/codeList'

import {
  getCodeListEditCodeList,
  getCodeListEditLevelActiveItemAndAncestorsUUIDs,
  getCodeListEditLevelActiveItem,
  getCodeListEditLevelActiveItemByUUID,
} from './codeListEditState'

import { debounceAction } from '../../appUtils/reduxUtils'
import { codeListsUpdate, dispatchCodeListsUpdate, dispatchCodeListUpdate } from '../codeLists/actions'

export const codeListEditUpdate = 'survey/codeListEdit/update'
export const codeListEditLevelActiveItemUpdate = 'survey/codeListEdit/levelActiveItem/update'

export const codeListEditLevelDelete = 'survey/codeListEdit/level/delete'

export const codeListEditLevelItemsUpdate = 'survey/codeListEdit/levelItems/update'
export const codeListEditLevelItemUpdate = 'survey/codeListEdit/levelItem/update'
export const codeListEditLevelItemCreate = 'survey/codeListEdit/levelItem/create'
export const codeListEditLevelItemDelete = 'survey/codeListEdit/levelItem/delete'

const dispatchCodeListEditUpdate = (dispatch, codeListUUID) =>
  dispatch({type: codeListEditUpdate, codeListUUID})

const dispatchCodeListEditLevelItemsUpdate = (dispatch, levelIndex, items) =>
  dispatch({type: codeListEditLevelItemsUpdate, levelIndex, items})

const dispatchCodeListEditLevelActiveItemUpdate = (dispatch, levelIndex, itemUUID) =>
  dispatch({type: codeListEditLevelActiveItemUpdate, levelIndex, itemUUID})

//======
//====== SET FOR EDIT
//======

export const setCodeListForEdit = (codeList) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())

  dispatchCodeListEditUpdate(dispatch, codeList ? codeList.uuid : null)

  //load first level items
  if (codeList)
    dispatch(loadCodeListLevelItems(surveyId, codeList.id))
}

export const setCodeListItemForEdit = (item, edit = true) => async (dispatch, getState) => {
  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatchCodeListEditLevelActiveItemUpdate(dispatch, level.index, edit ? item.uuid : null)

  //load child items
  dispatch(loadCodeListLevelItems(surveyId, codeList.id, level.index + 1, getCodeListItemId(item)))
}

//======
//====== CREATE
//======

export const createCodeList = () => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  // dispatchCodeListUpdate(dispatch, codeList)

  const codeList = newCodeList()
  const surveyId = getStateSurveyId(getState())
  const res = await axios.post(`/api/survey/${surveyId}/codeLists`, codeList)

  dispatchCodeListUpdate(dispatch, R.path(['data', 'codeList'], res))
  dispatchCodeListEditUpdate(dispatch, codeList.uuid)
}

export const createCodeListLevel = () => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)

  const codeList = getCodeListEditCodeList(survey)
  const level = newCodeListLevel(codeList)
  const updatedCodeList = assocCodeListLevel(level)(codeList)

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

  const levelIndex = level.index

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const parentItem = getCodeListEditLevelActiveItem(levelIndex - 1)(survey)
  const newItem = newCodeListItem(level.id, getCodeListItemId(parentItem))

  //save item
  const res = await axios.post(`/api/survey/${surveyId}/codeLists/${codeList.id}/items`, newItem)
  const {item, itemsValidation} = res.data

  dispatch({type: codeListEditLevelItemCreate, levelIndex, item})
  //update codeList items validation
  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(itemsValidation)(codeList))
}

//======
//====== READ
//======

// load items for specified level
const loadCodeListLevelItems = (surveyId, codeListId, levelIndex = 0, parentId = null) =>
  async dispatch => {

    dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, null) //reset level items

    const {data} = await axios.get(`/api/survey/${surveyId}/codeLists/${codeListId}/items`, {
      params: {
        draft: true,
        parentId
      }
    })

    dispatchCodeListEditLevelItemsUpdate(dispatch, levelIndex, toUUIDIndexedObj(data.items))
  }

//======
//====== UPDATE
//======

export const putCodeListProp = (codeListUUID, key, value) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)

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
  const surveyId = getStateSurveyId(state)

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

      dispatchCodeListUpdate(dispatch, assocCodeListLevelsValidation(data.validation)(codeList))
    } catch (e) {}
  }
  dispatch(debounceAction(action, `codeListLevel_${level.uuid}`))

}

export const putCodeListItemProp = (levelIndex, itemUUID, key, value) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)

  //update item in code list edit state
  const item = R.pipe(
    getCodeListEditLevelActiveItemByUUID(levelIndex, itemUUID),
    assocCodeListItemProp(key, value),
  )(survey)

  dispatch({type: codeListEditLevelItemUpdate, levelIndex, item})

  //dissoc item validation
  const ancestorItemsAndSelfUUIDs = getCodeListEditLevelActiveItemAndAncestorsUUIDs(levelIndex)(survey)
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

//======
//====== DELETE
//======

export const deleteCodeList = codeList => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const surveyId = getStateSurveyId(getState())

  dispatch({type: codeListsUpdate, codeLists: {[codeList.uuid]: null}})

  //delete code list and items from db
  await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = levelIndex => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  dispatch({type: codeListEditLevelDelete, levelIndex})

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelByIndex(levelIndex)(codeList)

  const updatedCodeList = dissocCodeListLevel(levelIndex)(codeList)
  dispatchCodeListUpdate(dispatch, updatedCodeList)

  //delete level and items from db
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`)

  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(data.itemsValidation)(updatedCodeList))
}

export const deleteCodeListItem = item => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const state = getState()
  const survey = getSurvey(state)
  const surveyId = getStateSurveyId(state)
  const codeList = getCodeListEditCodeList(survey)
  const level = getCodeListLevelById(item.levelId)(codeList)

  dispatch({type: codeListEditLevelItemDelete, itemUUID: item.uuid, levelIndex: level.index})

  //delete item from db
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`)

  //update items validation
  dispatchCodeListUpdate(dispatch, assocCodeListItemsValidation(data.itemsValidation)(codeList))
}


