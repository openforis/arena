import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import * as SurveyActions from '../actions'
import * as CategoriesActions from './actions'
import * as CategoriesState from './state'

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  // Reset state
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // Categories
  [CategoriesActions.categoriesUpdate]: (state, { categories }) => categories,

  // Category
  [CategoriesActions.categoryCreate]: (state, { category }) => CategoriesState.assocCategory(category)(state),

  [CategoriesActions.categoryUpdate]: (state, { category }) => CategoriesState.assocCategory(category)(state),

  [CategoriesActions.categoryPropUpdate]: (state, { category, key, value }) =>
    CategoriesState.assocCategoryProp(category, key, value)(state),

  [CategoriesActions.categoryDelete]: (state, { category }) => CategoriesState.dissocCategory(category)(state),

  // Category level
  [CategoriesActions.categoryLevelPropUpdate]: (state, { category, level, key, value }) =>
    CategoriesState.assocCategoryLevelProp(category, level, key, value)(state),

  [CategoriesActions.categoryLevelDelete]: (state, { category, level }) =>
    CategoriesState.dissocCategoryLevel(category, level)(state),

  // Category level items
  [CategoriesActions.categoryItemPropUpdate]: (state, { category, item, key }) =>
    CategoriesState.dissocCategoryLevelItemValidation(category, item, key)(state),
}

export default exportReducer(actionHandlers)
