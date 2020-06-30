import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '@webapp/utils/reduxUtils'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyState, CategoriesActions } from '@webapp/store/survey'
import { AppSavingActions, JobActions } from '@webapp/store/app'

import * as CategoryState from './categoryState'

export const categoryViewCategoryUpdate = 'categoryView/category/update'
export const categoryViewLevelActiveItemUpdate = 'categoryView/levelActiveItem/update'
export const categoryViewImportSummaryShow = 'categoryView/importSummary/show'
export const categoryViewImportSummaryHide = 'categoryView/importSummary/hide'
export const categoryViewImportSummaryColumnDataTypeUpdate = 'categoryView/importSummary/column/dataType/update'

export const dispatchCategoryUpdate = (dispatch, category) =>
  dispatch({ type: CategoriesActions.categoryUpdate, category })

// ======
// ====== READ
// ======

// load items for specified level
const loadLevelItems = (categoryUuid, levelIndex = 0, parentUuid = null) => async (dispatch, getState) => {
  // Reset level items first
  dispatch({ type: CategoriesActions.categoryItemsUpdate, levelIndex, items: null })

  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { items },
  } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
    params: { draft: true, parentUuid },
  })
  dispatch({ type: CategoriesActions.categoryItemsUpdate, levelIndex, items })
}

// ======
// ====== SET FOR EDIT
// ======

export const setCategoryForEdit = (categoryUuid) => async (dispatch) => {
  dispatch({ type: categoryViewCategoryUpdate, categoryUuid })

  // Load first level items
  if (categoryUuid) {
    dispatch(loadLevelItems(categoryUuid))
  }
}

export const setCategoryItemForEdit = (category, level, item, edit = true) => async (dispatch) => {
  const itemUuid = edit ? CategoryItem.getUuid(item) : null
  const levelIndex = CategoryLevel.getIndex(level)
  dispatch({ type: categoryViewLevelActiveItemUpdate, levelIndex, itemUuid })

  // Load child items
  dispatch(loadLevelItems(Category.getUuid(category), levelIndex + 1, itemUuid))
}

// ======
// ====== CREATE
// ======

export const createCategory = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { category },
  } = await axios.post(`/api/survey/${surveyId}/categories`, Category.newCategory())

  await dispatch({ type: CategoriesActions.categoryCreate, category })

  await dispatch(setCategoryForEdit(Category.getUuid(category)))

  return category
}

export const uploadCategory = (categoryUuid, file) => async (dispatch, getState) => {
  const formData = new FormData()
  formData.append('file', file)

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: summary } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData)

  dispatch({ type: categoryViewImportSummaryShow, summary })
}

export const createCategoryLevel = (category) => async (dispatch, getState) => {
  const level = Category.newLevel(category)
  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.post(`/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels`, level)
  dispatchCategoryUpdate(dispatch, data.category)
}

export const createCategoryLevelItem = (category, level, parentItem) => async (dispatch, getState) => {
  const item = CategoryItem.newItem(CategoryLevel.getUuid(level), CategoryItem.getUuid(parentItem))
  dispatch({ type: CategoriesActions.categoryItemCreate, level, item })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/categories/${Category.getUuid(category)}/items`, item)

  dispatchCategoryUpdate(dispatch, data.category)
  dispatch({ type: CategoriesActions.categoryItemUpdate, level, item: data.item })
}

// ======
// ====== UPDATE
// ======

export const putCategoryProp = (category, key, value) => async (dispatch, getState) => {
  dispatch({ type: CategoriesActions.categoryPropUpdate, category, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(`/api/survey/${surveyId}/categories/${Category.getUuid(category)}`, { key, value })
    dispatch({ type: CategoriesActions.categoriesUpdate, categories: data.categories })
  }

  dispatch(debounceAction(action, `${CategoriesActions.categoryPropUpdate}_${Category.getUuid(category)}`))
}

export const putCategoryLevelProp = (category, level, key, value) => async (dispatch, getState) => {
  dispatch({ type: CategoriesActions.categoryLevelPropUpdate, category, level, key, value })

  const levelUuid = CategoryLevel.getUuid(level)

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(
      `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels/${levelUuid}`,
      { key, value }
    )
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${CategoriesActions.categoryLevelPropUpdate}_${levelUuid}`))
}

export const putCategoryItemProp = (category, level, item, key, value) => async (dispatch, getState) => {
  dispatch({ type: CategoriesActions.categoryItemPropUpdate, category, level, item, key, value })

  const itemUuid = CategoryItem.getUuid(item)

  const action = async () => {
    dispatch(AppSavingActions.showAppSaving())
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(
      `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/items/${itemUuid}`,
      { key, value }
    )
    dispatch(AppSavingActions.hideAppSaving())
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${CategoriesActions.categoryItemPropUpdate}_${itemUuid}`))
}

// ======
// ====== DELETE
// ======

export const deleteCategory = (category) => async (dispatch, getState) => {
  dispatch({ type: CategoriesActions.categoryDelete, category })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/categories/${Category.getUuid(category)}`)
  dispatch({ type: CategoriesActions.categoriesUpdate, categories: data.categories })
}

export const deleteCategoryLevel = (category, level) => async (dispatch, getState) => {
  dispatch({ type: CategoriesActions.categoryLevelDelete, category, level })

  // Delete level and items from db
  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(
    `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels/${CategoryLevel.getUuid(level)}`
  )
  dispatchCategoryUpdate(dispatch, data.category)
}

export const deleteCategoryItem = (category, level, item) => (dispatch, getState) => {
  const state = getState()
  const itemsChildren = CategoryState.getLevelItemsArray(CategoryLevel.getIndex(level) + 1)(state)
  const messageKeyConfirm = R.isEmpty(itemsChildren)
    ? 'categoryEdit.confirmDeleteItem'
    : 'categoryEdit.confirmDeleteItemWithChildren'

  dispatch(
    DialogConfirmActions.showDialogConfirm({
      key: messageKeyConfirm,
      onOk: async () => {
        dispatch(LoaderActions.showLoader())
        const surveyId = SurveyState.getSurveyId(state)
        const { data } = await axios.delete(
          `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/items/${CategoryItem.getUuid(item)}`
        )
        dispatch({ type: CategoriesActions.categoryItemDelete, item, level })
        dispatchCategoryUpdate(dispatch, data.category)
        dispatch(LoaderActions.hideLoader())
      },
    })
  )
}

// ======
// ====== IMPORT
// ======

export const importCategory = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const category = CategoryState.getCategoryForEdit(state)
  const categoryUuid = Category.getUuid(category)
  const importSummary = CategoryState.getImportSummary(state)

  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, importSummary)

  dispatch(
    JobActions.showJobMonitor({
      job,
      onComplete: (jobCompleted) => {
        // Reload category
        dispatchCategoryUpdate(dispatch, jobCompleted.result.category)
        dispatch(setCategoryForEdit(categoryUuid))
      },
    })
  )
}

export const hideCategoryImportSummary = () => (dispatch) => dispatch({ type: categoryViewImportSummaryHide })

export const setCategoryImportSummaryColumnDataType = (columnName, dataType) => (dispatch) =>
  dispatch({
    type: categoryViewImportSummaryColumnDataTypeUpdate,
    columnName,
    dataType,
  })
