import { exportReducer } from '../../appUtils/reduxUtils'
import * as R from 'ramda'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import { taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate, taxonomiesUpdate } from './actions'
import { taxonomyCreate } from './actions'

const actionHandlers = {
  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsLoad]: (state, {taxonomies}) => taxonomies,

  // create
  [taxonomyCreate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  // update
  [taxonomyUpdate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  [taxonomiesUpdate]: (state, {taxonomies}) => taxonomies,

  [taxonomyPropUpdate]: (state, {taxonomy, key, value}) => R.pipe(
    R.assocPath([taxonomy.uuid, 'props', key], value),
    R.dissocPath([taxonomy.uuid, 'validation', 'fields', key]),
  )(state),

  // delete
  [taxonomyDelete]: (state, {taxonomy}) => R.dissoc(taxonomy.uuid)(state),
}

export default exportReducer(actionHandlers)