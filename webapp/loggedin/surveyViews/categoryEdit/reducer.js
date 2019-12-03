import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { appUserLogout } from '@webapp/app/actions'
import {
  surveyCreate,
  surveyDelete,
  surveyUpdate,
} from '@webapp/survey/actions'
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
  categoryEditUpdate,
  categoryEditImportSummaryHide,
  categoryEditImportSummaryShow,
  categoryEditImportSummaryColumnDataTypeUpdate,
  categoryEditLevelActiveItemUpdate,
} from './actions'

import * as CategoryEditState from './categoryEditState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [categoryEditUpdate]: (state, { categoryUuid }) =>
    CategoryEditState.initCategoryEdit(categoryUuid),

  // Category
  [categoryCreate]: (state, { category }) =>
    CategoryEditState.initCategoryEdit(Category.getUuid(category)),

  // ===== category level
  [categoryLevelDelete]: (state, { level }) =>
    CategoryEditState.dissocLevel(CategoryLevel.getIndex(level))(state),

  // ===== category level items
  [categoryItemsUpdate]: (state, { levelIndex, items }) =>
    CategoryEditState.assocLevelItems(levelIndex, items)(state),

  // ===== category level item
  [categoryItemCreate]: (state, { level, item }) =>
    CategoryEditState.createLevelItem(
      CategoryLevel.getIndex(level),
      item,
    )(state),

  [categoryItemUpdate]: (state, { level, item }) =>
    CategoryEditState.assocLevelItem(
      CategoryLevel.getIndex(level),
      item,
    )(state),

  [categoryItemPropUpdate]: (state, { level, item, key, value }) =>
    CategoryEditState.assocLevelItemProp(level, item, key, value)(state),

  [categoryItemDelete]: (state, { level, item }) =>
    CategoryEditState.dissocLevelItem(
      CategoryLevel.getIndex(level),
      CategoryItem.getUuid(item),
    )(state),

  // ===== category level active item
  [categoryEditLevelActiveItemUpdate]: (state, { levelIndex, itemUuid }) =>
    CategoryEditState.assocLevelActiveItem(levelIndex, itemUuid)(state),

  // ===== category import summary
  [categoryEditImportSummaryShow]: (state, { summary }) =>
    CategoryEditState.assocImportSummary(summary)(state),

  [categoryEditImportSummaryHide]: state =>
    CategoryEditState.dissocImportSummary(state),

  [categoryEditImportSummaryColumnDataTypeUpdate]: (
    state,
    { columnName, dataType },
  ) =>
    CategoryEditState.assocImportSummaryColumnDataType(
      columnName,
      dataType,
    )(state),
}

export default exportReducer(actionHandlers)
