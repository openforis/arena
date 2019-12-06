import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  categoryCreate,
  categoryItemCreate,
  categoryItemDelete,
  categoryItemPropUpdate,
  categoryItemsUpdate,
  categoryItemUpdate,
  categoryLevelDelete,
} from '@webapp/survey/categories/actions'
import { formReset } from '../surveyForm/actions'

import {
  categoryViewCategoryUpdate,
  categoryViewImportSummaryHide,
  categoryViewImportSummaryShow,
  categoryViewImportSummaryColumnDataTypeUpdate,
  categoryViewLevelActiveItemUpdate,
} from './actions'

import * as CategoryState from './categoryState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [categoryViewCategoryUpdate]: (state, { categoryUuid }) => CategoryState.initCategoryEdit(categoryUuid),

  // Category
  [categoryCreate]: (state, { category }) => CategoryState.initCategoryEdit(Category.getUuid(category)),

  // ===== category level
  [categoryLevelDelete]: (state, { level }) => CategoryState.dissocLevel(CategoryLevel.getIndex(level))(state),

  // ===== category level items
  [categoryItemsUpdate]: (state, { levelIndex, items }) => CategoryState.assocLevelItems(levelIndex, items)(state),

  // ===== category level item
  [categoryItemCreate]: (state, { level, item }) =>
    CategoryState.createLevelItem(CategoryLevel.getIndex(level), item)(state),

  [categoryItemUpdate]: (state, { level, item }) =>
    CategoryState.assocLevelItem(CategoryLevel.getIndex(level), item)(state),

  [categoryItemPropUpdate]: (state, { level, item, key, value }) =>
    CategoryState.assocLevelItemProp(level, item, key, value)(state),

  [categoryItemDelete]: (state, { level, item }) =>
    CategoryState.dissocLevelItem(CategoryLevel.getIndex(level), CategoryItem.getUuid(item))(state),

  // ===== category level active item
  [categoryViewLevelActiveItemUpdate]: (state, { levelIndex, itemUuid }) =>
    CategoryState.assocLevelActiveItem(levelIndex, itemUuid)(state),

  // ===== category import summary
  [categoryViewImportSummaryShow]: (state, { summary }) => CategoryState.assocImportSummary(summary)(state),

  [categoryViewImportSummaryHide]: state => CategoryState.dissocImportSummary(state),

  [categoryViewImportSummaryColumnDataTypeUpdate]: (state, { columnName, dataType }) =>
    CategoryState.assocImportSummaryColumnDataType(columnName, dataType)(state),
}

export default exportReducer(actionHandlers)
