import { exportReducer } from '../../../appUtils/reduxUtils'

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

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [categoryEditUpdate]: (state, {categoryUuid}) => initCategoryEdit(categoryUuid),

  // category
  [categoryCreate]: (state, {category}) => initCategoryEdit(category.uuid),

  // ===== category level
  [categoryLevelDelete]: (state, {level}) => dissocLevel(level.index)(state),

  // ===== category level items
  [categoryItemsUpdate]: (state, {levelIndex, items}) => assocLevelItems(levelIndex, items)(state),

  // ===== category level item
  [categoryItemCreate]: (state, {level, item}) => createLevelItem(level.index, item)(state),

  [categoryItemUpdate]: (state, {level, item}) => assocLevelItem(level.index, item)(state),

  [categoryItemPropUpdate]: (state, {level, item, key, value}) => assocLevelItemProp(level, item, key, value)(state),

  [categoryItemDelete]: (state, {level, item}) => dissocLevelItem(level.index, item.uuid)(state),

  // ===== category level active item
  [categoryEditLevelActiveItemUpdate]: (state, {levelIndex, itemUuid}) =>
    assocLevelActiveItem(levelIndex, itemUuid)(state),
}

export default exportReducer(actionHandlers)