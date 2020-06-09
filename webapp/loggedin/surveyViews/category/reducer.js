import { exportReducer } from '@webapp/utils/reduxUtils'

import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { UserActions } from '@webapp/store/system'
import { SurveyActions, CategoriesActions } from '@webapp/store/survey'
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
  [UserActions.APP_USER_LOGOUT]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [categoryViewCategoryUpdate]: (state, { categoryUuid }) => CategoryState.initCategoryEdit(categoryUuid),

  // Category

  // ===== category level
  [CategoriesActions.categoryLevelDelete]: (state, { level }) =>
    CategoryState.dissocLevel(CategoryLevel.getIndex(level))(state),

  // ===== category level items
  [CategoriesActions.categoryItemsUpdate]: (state, { levelIndex, items }) =>
    CategoryState.assocLevelItems(levelIndex, items)(state),

  // ===== category level item
  [CategoriesActions.categoryItemCreate]: (state, { level, item }) =>
    CategoryState.createLevelItem(CategoryLevel.getIndex(level), item)(state),

  [CategoriesActions.categoryItemUpdate]: (state, { level, item }) =>
    CategoryState.assocLevelItem(CategoryLevel.getIndex(level), item)(state),

  [CategoriesActions.categoryItemPropUpdate]: (state, { level, item, key, value }) =>
    CategoryState.assocLevelItemProp(CategoryLevel.getIndex(level), item, key, value)(state),

  [CategoriesActions.categoryItemDelete]: (state, { level, item }) =>
    CategoryState.dissocLevelItem(CategoryLevel.getIndex(level), CategoryItem.getUuid(item))(state),

  // ===== category level active item
  [categoryViewLevelActiveItemUpdate]: (state, { levelIndex, itemUuid }) =>
    CategoryState.assocLevelActiveItem(levelIndex, itemUuid)(state),

  // ===== category import summary
  [categoryViewImportSummaryShow]: (state, { summary }) => CategoryState.assocImportSummary(summary)(state),

  [categoryViewImportSummaryHide]: (state) => CategoryState.dissocImportSummary(state),

  [categoryViewImportSummaryColumnDataTypeUpdate]: (state, { columnName, dataType }) =>
    CategoryState.assocImportSummaryColumnDataType(columnName, dataType)(state),
}

export default exportReducer(actionHandlers)
