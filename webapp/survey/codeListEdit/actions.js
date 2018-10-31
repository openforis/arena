import axios from 'axios'

import { toUUIDIndexedObj } from '../../../common/survey/surveyUtils'
import { getStateSurveyId } from '../surveyState'

import { newCodeList, newCodeListItem, newCodeListLevel } from '../../../common/survey/codeList'

import { debounceAction } from '../../appUtils/reduxUtils'

// code list editor
export const codeListEditUpdate = 'survey/codeListEdit/update'
export const codeListEditLevelActiveItemUpdate = 'survey/codeListEdit/levelActiveItem/update'

// code list
export const codeListCreate = 'survey/codeList/create'
export const codeListUpdate = 'survey/codeList/update'
export const codeListPropUpdate = 'survey/codeList/prop/update'
export const codeListDelete = 'survey/codeList/delete'

// code list level
export const codeListLevelPropUpdate = 'survey/codeList/level/prop/update'
export const codeListLevelDelete = 'survey/codeList/level/delete'

// code list items
export const codeListItemsUpdate = 'survey/codeList/level/items/update'
export const codeListItemCreate = 'survey/codeList/level/item/create'
export const codeListItemUpdate = 'survey/codeList/level/item/update'
export const codeListItemPropUpdate = 'survey/codeList/level/item/prop/update'
export const codeListItemDelete = 'survey/codeList/level/item/delete'

export const dispatchCodeListUpdate = (dispatch, codeList) =>
  dispatch({type: codeListUpdate, codeList})

//======
//====== SET FOR EDIT
//======

export const setCodeListForEdit = (codeList) => async (dispatch) => {
  const codeListUUID = codeList ? codeList.uuid : null
  dispatch({type: codeListEditUpdate, codeListUUID})

  //load first level items
  if (codeList)
    dispatch(loadCodeListLevelItems(codeList.id))
}

export const setCodeListItemForEdit = (codeList, level, item, edit = true) => async (dispatch) => {
  const itemUUID = edit ? item.uuid : null
  dispatch({type: codeListEditLevelActiveItemUpdate, levelIndex: level.index, itemUUID})

  //load child items
  dispatch(loadCodeListLevelItems(codeList.id, level.index + 1, item.id))
}

//======
//====== CREATE
//======

export const createCodeList = () => async (dispatch, getState) => {
  const codeList = newCodeList()
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/codeLists`, codeList)

  dispatch({type: codeListCreate, codeList: data.codeList})
}

export const createCodeListLevel = (codeList) => async (dispatch, getState) => {
  const level = newCodeListLevel(codeList)
  const surveyId = getStateSurveyId(getState())

  const {data} = await axios.post(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels`, level)
  dispatchCodeListUpdate(dispatch, data.codeList)
}

export const createCodeListItem = (codeList, level, parentItem) => async (dispatch, getState) => {
  const item = newCodeListItem(level.id, parentItem)
  dispatch({type: codeListItemCreate, level, item})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/codeLists/${codeList.id}/items`, item)

  dispatchCodeListUpdate(dispatch, data.codeList)
  dispatch({type: codeListItemUpdate, level, item: data.item})
}

//======
//====== READ
//======

// load items for specified level
const loadCodeListLevelItems = (codeListId, levelIndex = 0, parentId = null) =>
  async (dispatch, getState) => {
    //reset level items first
    dispatch({type: codeListItemsUpdate, levelIndex, items: null})

    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/codeLists/${codeListId}/items`, {
      params: {
        draft: true,
        parentId
      }
    })
    const items = toUUIDIndexedObj(data.items)
    dispatch({type: codeListItemsUpdate, levelIndex, items})
  }

//======
//====== UPDATE
//======

export const putCodeListProp = (codeList, key, value) => async (dispatch, getState) => {
  dispatch({type: codeListPropUpdate, codeList, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}`, {key, value})
    dispatchCodeListUpdate(dispatch, data.codeList)
  }

  dispatch(debounceAction(action, `${codeListPropUpdate}_${codeList.uuid}`))
}

export const putCodeListLevelProp = (codeList, level, key, value) => async (dispatch, getState) => {
  dispatch({type: codeListLevelPropUpdate, codeList, level, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} =
      await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`, {key, value})
    dispatchCodeListUpdate(dispatch, data.codeList)
  }

  dispatch(debounceAction(action, `${codeListLevelPropUpdate}_${level.uuid}`))
}

export const putCodeListItemProp = (codeList, level, item, key, value) => async (dispatch, getState) => {
  dispatch({type: codeListItemPropUpdate, codeList, level, item, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`, {key, value})
    dispatchCodeListUpdate(dispatch, data.codeList)
  }

  dispatch(debounceAction(action, `${codeListItemPropUpdate}_${item.uuid}`))
}

//======
//====== DELETE
//======

export const deleteCodeList = codeList => async (dispatch, getState) => {
  dispatch({type: codeListDelete, codeList})

  //delete code list and items from db
  const surveyId = getStateSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}`)
}

export const deleteCodeListLevel = (codeList, level) => async (dispatch, getState) => {
  dispatch({type: codeListLevelDelete, codeList, level})

  //delete level and items from db
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/levels/${level.id}`)
  dispatchCodeListUpdate(dispatch, data.codeList)
}

export const deleteCodeListItem = (codeList, level, item) => async (dispatch, getState) => {
  dispatch({type: codeListItemDelete, item, level})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/codeLists/${codeList.id}/items/${item.id}`)
  dispatchCodeListUpdate(dispatch, data.codeList)
}