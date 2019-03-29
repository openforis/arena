import { exportReducer } from '../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../app/actions'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import {
  initCategoryEdit,
  dissocLevel,

  createLevelItem,
  assocLevelItems,
  assocLevelItem,
  assocLevelItemProp,
  dissocLevelItem,

  assocLevelActiveItem,
} from './categoryEditState'

import {
  categoryEditUpdate,
  categoryEditLevelActiveItemUpdate,
} from './actions'

import {
  categoryCreate,
  categoryItemCreate,
  categoryItemDelete,
  categoryItemPropUpdate,
  categoryItemsUpdate,
  categoryItemUpdate,
  categoryLevelDelete,
} from '../../../survey/categories/actions'

import Category from '../../../../common/survey/category'
import CategoryLevel from '../../../../common/survey/categoryLevel'
import CategoryItem from '../../../../common/survey/categoryItem'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [categoryEditUpdate]: (state, { categoryUuid }) => initCategoryEdit(categoryUuid),

  // category
  [categoryCreate]: (state, { category }) => initCategoryEdit(Category.getUuid(category)),

  // ===== category level
  [categoryLevelDelete]: (state, { level }) => dissocLevel(CategoryLevel.getIndex(level))(state),

  // ===== category level items
  [categoryItemsUpdate]: (state, { levelIndex, items }) => assocLevelItems(levelIndex, items)(state),

  // ===== category level item
  [categoryItemCreate]: (state, { level, item }) => createLevelItem(CategoryLevel.getIndex(level), item)(state),

  [categoryItemUpdate]: (state, { level, item }) => assocLevelItem(CategoryLevel.getIndex(level), item)(state),

  [categoryItemPropUpdate]: (state, { level, item, key, value }) => assocLevelItemProp(level, item, key, value)(state),

  [categoryItemDelete]: (state, { level, item }) => dissocLevelItem(CategoryLevel.getIndex(level), CategoryItem.getUuid(item))(state),

  // ===== category level active item
  [categoryEditLevelActiveItemUpdate]: (state, { levelIndex, itemUuid }) =>
    assocLevelActiveItem(levelIndex, itemUuid)(state),
}

export default exportReducer(actionHandlers)