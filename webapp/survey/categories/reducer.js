
import {exportReducer} from '@webapp/utils/reduxUtils'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate} from '../actions'
import * as CategoriesState from './categoriesState'

import {
  categoryCreate,
  categoryUpdate,
  categoriesUpdate,
  categoryPropUpdate,
  categoryDelete,
  categoryLevelPropUpdate,
  categoryLevelDelete,
  categoryItemPropUpdate,
} from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  // Reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  // Categories
  [surveyDefsLoad]: (state, {categories}) => categories,
  [categoriesUpdate]: (state, {categories}) => categories,

  // Category
  [categoryCreate]: (state, {category}) => CategoriesState.assocCategory(category)(state),

  [categoryUpdate]: (state, {category}) => CategoriesState.assocCategory(category)(state),

  [categoryPropUpdate]: (state, {category, key, value}) => CategoriesState.assocCategoryProp(category, key, value)(state),

  [categoryDelete]: (state, {category}) => CategoriesState.dissocCategory(category)(state),

  // Category level
  [categoryLevelPropUpdate]: (state, {category, level, key, value}) => CategoriesState.assocCategoryLevelProp(category, level, key, value)(state),

  [categoryLevelDelete]: (state, {category, level}) => CategoriesState.dissocCategoryLevel(category, level)(state),

  // Category level items
  [categoryItemPropUpdate]: (state, {category, item, key}) => CategoriesState.dissocCategoryLevelItemValidation(category, item, key)(state),

}

export default exportReducer(actionHandlers)
