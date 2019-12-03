import axios from 'axios'

import { debounceAction } from '@webapp/utils/reduxUtils'

import * as SurveyState from '@webapp/survey/surveyState'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

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
} from '@webapp/survey/categories/actions'

import { showAppJobMonitor } from '@webapp/loggedin/appJob/actions'

import * as CategoryEditState from './categoryEditState'

export const categoryEditUpdate = 'surveyForm/categoryEdit/update'
export const categoryEditLevelActiveItemUpdate =
  'surveyForm/categoryEdit/levelActiveItem/update'
export const categoryEditImportSummaryShow =
  'surveyForm/categoryEdit/importSummary/show'
export const categoryEditImportSummaryHide =
  'surveyForm/categoryEdit/importSummary/hide'
export const categoryEditImportSummaryColumnDataTypeUpdate =
  'surveyForm/categoryEdit/importSummary/column/dataType/update'

export const dispatchCategoryUpdate = (dispatch, category) =>
  dispatch({ type: categoryUpdate, category })

// ======
// ====== SET FOR EDIT
// ======

export const setCategoryForEdit = category => async dispatch => {
  const categoryUuid = Category.getUuid(category)
  dispatch({ type: categoryEditUpdate, categoryUuid })

  // Load first level items
  if (category) {
    dispatch(loadLevelItems(categoryUuid))
  }
}

export const setCategoryItemForEdit = (
  category,
  level,
  item,
  edit = true,
) => async dispatch => {
  const itemUuid = edit ? CategoryItem.getUuid(item) : null
  const levelIndex = CategoryLevel.getIndex(level)
  dispatch({ type: categoryEditLevelActiveItemUpdate, levelIndex, itemUuid })

  // Load child items
  dispatch(loadLevelItems(Category.getUuid(category), levelIndex + 1, itemUuid))
}

// ======
// ====== CREATE
// ======

export const createCategory = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(
    `/api/survey/${surveyId}/categories`,
    Category.newCategory(),
  )

  const category = data.category

  dispatch({ type: categoryCreate, category })

  return category
}

export const uploadCategory = (categoryUuid, file) => async (
  dispatch,
  getState,
) => {
  const formData = new FormData()
  formData.append('file', file)

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: summary } = await axios.post(
    `/api/survey/${surveyId}/categories/${categoryUuid}/upload`,
    formData,
  )

  dispatch({ type: categoryEditImportSummaryShow, summary })
}

export const importCategory = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const category = CategoryEditState.getCategoryForEdit(state)
  const categoryUuid = Category.getUuid(category)
  const importSummary = CategoryEditState.getImportSummary(state)

  const {
    data: { job },
  } = await axios.post(
    `/api/survey/${surveyId}/categories/${categoryUuid}/import`,
    importSummary,
  )

  dispatch(
    showAppJobMonitor(job, jobCompleted => {
      // Reload category
      dispatchCategoryUpdate(dispatch, jobCompleted.result.category)
      dispatch(setCategoryForEdit({ [Category.keys.uuid]: categoryUuid }))
    }),
  )
}

export const hideCategoryImportSummary = () => dispatch =>
  dispatch({ type: categoryEditImportSummaryHide })

export const setCategoryImportSummaryColumnDataType = (
  columnName,
  dataType,
) => dispatch =>
  dispatch({
    type: categoryEditImportSummaryColumnDataTypeUpdate,
    columnName,
    dataType,
  })

export const createCategoryLevel = category => async (dispatch, getState) => {
  const level = Category.newLevel(category)
  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.post(
    `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels`,
    level,
  )
  dispatchCategoryUpdate(dispatch, data.category)
}

export const createCategoryLevelItem = (category, level, parentItem) => async (
  dispatch,
  getState,
) => {
  const item = CategoryItem.newItem(
    CategoryLevel.getUuid(level),
    CategoryItem.getUuid(parentItem),
  )
  dispatch({ type: categoryItemCreate, level, item })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(
    `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/items`,
    item,
  )

  dispatchCategoryUpdate(dispatch, data.category)
  dispatch({ type: categoryItemUpdate, level, item: data.item })
}

// ======
// ====== READ
// ======

// load items for specified level
const loadLevelItems = (
  categoryUuid,
  levelIndex = 0,
  parentUuid = null,
) => async (dispatch, getState) => {
  // Reset level items first
  dispatch({ type: categoryItemsUpdate, levelIndex, items: null })

  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { items },
  } = await axios.get(
    `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
    { params: { draft: true, parentUuid } },
  )
  dispatch({ type: categoryItemsUpdate, levelIndex, items })
}

// ======
// ====== UPDATE
// ======

export const putCategoryProp = (category, key, value) => async (
  dispatch,
  getState,
) => {
  dispatch({ type: categoryPropUpdate, category, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const {
      data,
    } = await axios.put(
      `/api/survey/${surveyId}/categories/${Category.getUuid(category)}`,
      { key, value },
    )
    dispatch({ type: categoriesUpdate, categories: data.categories })
  }

  dispatch(
    debounceAction(
      action,
      `${categoryPropUpdate}_${Category.getUuid(category)}`,
    ),
  )
}

export const putCategoryLevelProp = (category, level, key, value) => async (
  dispatch,
  getState,
) => {
  dispatch({ type: categoryLevelPropUpdate, category, level, key, value })

  const levelUuid = CategoryLevel.getUuid(level)

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const {
      data,
    } = await axios.put(
      `/api/survey/${surveyId}/categories/${Category.getUuid(
        category,
      )}/levels/${levelUuid}`,
      { key, value },
    )
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${categoryLevelPropUpdate}_${levelUuid}`))
}

export const putCategoryItemProp = (
  category,
  level,
  item,
  key,
  value,
) => async (dispatch, getState) => {
  dispatch({ type: categoryItemPropUpdate, category, level, item, key, value })

  const itemUuid = CategoryItem.getUuid(item)

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(
      `/api/survey/${surveyId}/categories/${Category.getUuid(
        category,
      )}/items/${itemUuid}`,
      {
        key,
        value,
      },
    )
    dispatchCategoryUpdate(dispatch, data.category)
  }

  dispatch(debounceAction(action, `${categoryItemPropUpdate}_${itemUuid}`))
}

// ======
// ====== DELETE
// ======

export const deleteCategory = category => async (dispatch, getState) => {
  dispatch({ type: categoryDelete, category })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(
    `/api/survey/${surveyId}/categories/${Category.getUuid(category)}`,
  )
  dispatch({ type: categoriesUpdate, categories: data.categories })
}

export const deleteCategoryLevel = (category, level) => async (
  dispatch,
  getState,
) => {
  dispatch({ type: categoryLevelDelete, category, level })

  // Delete level and items from db
  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(
    `/api/survey/${surveyId}/categories/${Category.getUuid(
      category,
    )}/levels/${CategoryLevel.getUuid(level)}`,
  )
  dispatchCategoryUpdate(dispatch, data.category)
}

export const deleteCategoryItem = (category, level, item) => async (
  dispatch,
  getState,
) => {
  dispatch({ type: categoryItemDelete, item, level })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(
    `/api/survey/${surveyId}/categories/${Category.getUuid(
      category,
    )}/items/${CategoryItem.getUuid(item)}`,
  )
  dispatchCategoryUpdate(dispatch, data.category)
}
