import axios from 'axios'

import { toUUIDIndexedObj } from '../../../../common/survey/surveyUtils'
import { getStateSurveyId } from '../../../survey/surveyState'

import Category from '../../../../common/survey/category'

import { debounceAction } from '../../../appUtils/reduxUtils'
import {
  categoryCreate,
  categoryDelete,
  categoryItemCreate,
  categoryItemDelete,
  categoryItemPropUpdate,
  categoryItemsUpdate,
  categoryItemUpdate,
  categoryLevelDelete,
  categoryLevelPropUpdate,
  categoryPropUpdate,
  categoryUpdate,
  categoriesUpdate,
} from '../../../survey/categories/actions'

export const categoryEditUpdate = 'surveyForm/categoryEdit/update'
export const categoryEditLevelActiveItemUpdate = 'surveyForm/categoryEdit/levelActiveItem/update'

export const dispatchCategoryUpdate = (dispatch, category) =>
  dispatch({type: categoryUpdate, category})

//======
//====== SET FOR EDIT
//======

export const setCategoryForEdit = (category) => async (dispatch) => {
  const categoryUuid = category ? category.uuid : null
  dispatch({type: categoryEditUpdate, categoryUuid})

  //load first level items
  if (category)
    dispatch(loadLevelItems(category.id))
}

export const setCategoryItemForEdit = (category, level, item, edit = true) => async (dispatch) => {
  const itemUuid = edit ? item.uuid : null
  dispatch({type: categoryEditLevelActiveItemUpdate, levelIndex: level.index, itemUuid})

  //load child items
  dispatch(loadLevelItems(category.id, level.index + 1, item.uuid))
}

//======
//====== CREATE
//======

export const createCategory = () => async (dispatch, getState) => {
  const category = Category.newCategory()
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/categories`, category)

  dispatch({type: categoryCreate, category: data.category})
}

export const createCategoryLevel = (category) => async (dispatch, getState) => {
  const level = Category.newLevel(category)
  const surveyId = getStateSurveyId(getState())

  const {data} = await axios.post(`/api/survey/${surveyId}/categories/${category.id}/levels`, level)
  dispatchCategoryUpdate(dispatch, data.category)
}

export const createCategoryLevelItem = (category, level, parentItem) => async (dispatch, getState) => {
  const item = Category.newItem(level.id, parentItem)
  dispatch({type: categoryItemCreate, level, item})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/categories/${category.id}/items`, item)

  dispatchCategoryUpdate(dispatch, data.category)
  dispatch({type: categoryItemUpdate, level, item: data.item})
}

//======
//====== READ
//======

// load items for specified level
const loadLevelItems = (categoryId, levelIndex = 0, parentUuid = null) =>
  async (dispatch, getState) => {
    //reset level items first
    dispatch({type: categoryItemsUpdate, levelIndex, items: null})

    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.get(
      `/api/survey/${surveyId}/categories/${categoryId}/items`,
      {params: {draft: true, parentUuid}}
    )
    const items = toUUIDIndexedObj(data.items)
    dispatch({type: categoryItemsUpdate, levelIndex, items})
  }

//======
//====== UPDATE
//======

export const putCategoryProp = (category, key, value) => async (dispatch, getState) => {
  dispatch({type: categoryPropUpdate, category, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(`/api/survey/${surveyId}/categories/${category.id}`, {key, value})
    dispatch({type: categoriesUpdate, categories: data.categories})
  }

  dispatch(debounceAction(action, `${categoryPropUpdate}_${category.uuid}`))
}

export const putCategoryLevelProp = (category, level, key, value) => async (dispatch, getState) => {
  dispatch({type: categoryLevelPropUpdate, category, level, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(
      `/api/survey/${surveyId}/categories/${category.id}/levels/${level.id}`,
      {key, value}
    )
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${categoryLevelPropUpdate}_${level.uuid}`))
}

export const putCategoryItemProp = (category, level, item, key, value) => async (dispatch, getState) => {
  dispatch({type: categoryItemPropUpdate, category, level, item, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(`/api/survey/${surveyId}/categories/${category.id}/items/${item.id}`, {key, value})
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${categoryItemPropUpdate}_${item.uuid}`))
}

//======
//====== DELETE
//======

export const deleteCategory = category => async (dispatch, getState) => {
  dispatch({type: categoryDelete, category})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/categories/${category.id}`)
  dispatch({type: categoriesUpdate, categories: data.categories})
}

export const deleteCategoryLevel = (category, level) => async (dispatch, getState) => {
  dispatch({type: categoryLevelDelete, category, level})

  //delete level and items from db
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/categories/${category.id}/levels/${level.id}`)
  dispatchCategoryUpdate(dispatch, data.category)
}

export const deleteCategoryItem = (category, level, item) => async (dispatch, getState) => {
  dispatch({type: categoryItemDelete, item, level})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/categories/${category.id}/items/${item.id}`)
  dispatchCategoryUpdate(dispatch, data.category)
}