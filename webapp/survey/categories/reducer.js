import * as R from 'ramda'

import Category from '../../../common/survey/category'
import CategoryLevel from '../../../common/survey/categoryLevel'

import { exportReducer } from '../../appUtils/reduxUtils'

import { appUserLogout } from '../../app/actions'
import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

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

  [surveyDefsLoad]: (state, { categories }) => categories,

  // category
  [categoryCreate]: (state, { category }) => R.assoc(Category.getUuid(category), category, state),

  [categoryUpdate]: (state, { category }) => R.assoc(Category.getUuid(category), category, state),

  [categoriesUpdate]: (state, { categories }) => categories,

  [categoryPropUpdate]: (state, { category, key, value }) => R.pipe(
    R.assocPath([Category.getUuid(category), 'props', key], value),
    R.dissocPath([Category.getUuid(category), 'validation', 'fields', key])
  )(state),

  [categoryDelete]: (state, { category }) => R.dissoc(Category.getUuid(category), state),

  // category level
  [categoryLevelPropUpdate]: (state, { category, level, key, value }) => R.pipe(
    R.assocPath([Category.getUuid(category), 'levels', CategoryLevel.getIndex(level) + '', 'props', key], value),
    R.dissocPath([Category.getUuid(category), 'levels', CategoryLevel.getIndex(level) + '', 'validation', 'fields', key])
  )(state),

  [categoryLevelDelete]: (state, { category, level }) =>
    R.dissocPath([Category.getUuid(category), 'levels', level.index + ''])(state),

  // category items
  [categoryItemPropUpdate]: (state, { category, item, key }) =>
    R.dissocPath([Category.getUuid(category), 'validation', 'fields', 'items', 'fields', Category.getUuid(category), 'fields', key])
    (state),

}

export default exportReducer(actionHandlers)