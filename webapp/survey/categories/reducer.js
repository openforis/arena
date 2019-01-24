import * as R from 'ramda'

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
  [categoryCreate]: (state, { category }) => R.assoc(category.uuid, category, state),

  [categoryUpdate]: (state, { category }) => R.assoc(category.uuid, category, state),

  [categoriesUpdate]: (state, { categories }) => categories,

  [categoryPropUpdate]: (state, { category, key, value }) => R.pipe(
    R.assocPath([category.uuid, 'props', key], value),
    R.dissocPath([category.uuid, 'validation', 'fields', key])
  )(state),

  [categoryDelete]: (state, { category }) => R.dissoc(category.uuid, state),

  // category level
  [categoryLevelPropUpdate]: (state, { category, level, key, value }) => R.pipe(
    R.assocPath([category.uuid, 'levels', level.index + '', 'props', key], value),
    R.dissocPath([category.uuid, 'levels', level.index + '', 'validation', 'fields', key])
  )(state),

  [categoryLevelDelete]: (state, { category, level }) =>
    R.dissocPath([category.uuid, 'levels', level.index + ''])(state),

  // category items
  [categoryItemPropUpdate]: (state, { category, item, key }) =>
    R.dissocPath([category.uuid, 'validation', 'fields', 'items', 'fields', item.uuid, 'fields', key])
    (state),

}

export default exportReducer(actionHandlers)