import { exportReducer } from '../../appUtils/reduxUtils'
import * as R from 'ramda'

import { surveyUpdate } from '../actions'
import { formReset } from '../form/actions'

import { taxonomiesLoad } from './actions'
import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../../appModules/designer/taxonomyEdit/actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [taxonomiesLoad]: (state, {taxonomies}) => taxonomies,

  // create
  [taxonomyCreate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  // update
  [taxonomyUpdate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  [taxonomyPropUpdate]: (state, {taxonomy, key, value}) => R.pipe(
    R.assocPath([taxonomy.uuid, 'props', key], value),
    R.dissocPath([taxonomy.uuid, 'validation', 'fields', key]),
  )(state),

  // delete
  [taxonomyDelete]: (state, {taxonomy}) => R.dissoc(taxonomy.uuid)(state),
}

export default exportReducer(actionHandlers)