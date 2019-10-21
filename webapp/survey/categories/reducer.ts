import * as CategoriesState from './categoriesState'

import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'
import { surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate } from '../actions'

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

  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  // categories
  [surveyDefsLoad]: (state, { categories }) => categories,
  [categoriesUpdate]: (state, { categories }) => categories,

  // category
  [categoryCreate]: (state, { category }) => CategoriesState.assocCategory(category)(state),

  [categoryUpdate]: (state, { category }) => CategoriesState.assocCategory(category)(state),

  [categoryPropUpdate]: (state, { category, key, value }) => CategoriesState.assocCategoryProp(category, key, value)(state),

  [categoryDelete]: (state, { category }) => CategoriesState.dissocCategory(category)(state),

  // category level
  [categoryLevelPropUpdate]: (state, { category, level, key, value }) => CategoriesState.assocCategoryLevelProp(category, level, key, value)(state),

  [categoryLevelDelete]: (state, { category, level }) => CategoriesState.dissocCategoryLevel(category, level)(state),

  // category level items
  [categoryItemPropUpdate]: (state, { category, item, key }) => CategoriesState.dissocCategoryLevelItemValidation(category, item, key)(state),

}

export default exportReducer(actionHandlers)
