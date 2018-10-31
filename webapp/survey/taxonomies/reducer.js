import { exportReducer } from '../../appUtils/reduxUtils'
import * as R from 'ramda'

import { surveyUpdate } from '../actions'
import { formReset } from '../form/actions'

import { taxonomiesUpdate } from './actions'
import { taxonomyCreate, taxonomyDelete, taxonomyUpdate } from '../taxonomyEdit/actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [taxonomiesUpdate]: (state, {taxonomies}) => taxonomies,

  // create
  [taxonomyCreate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  // update
  [taxonomyUpdate]: (state, {taxonomy}) => R.assoc(taxonomy.uuid, taxonomy)(state),

  // delete
  [taxonomyDelete]: (state, {taxonomy}) => R.dissoc(taxonomy.uuid)(state),
}

export default exportReducer(actionHandlers)