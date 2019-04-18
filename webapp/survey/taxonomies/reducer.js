import { exportReducer } from '../../utils/reduxUtils'
import * as R from 'ramda'

import Taxonomy from '../../../common/survey/taxonomy'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import { taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate, taxonomiesUpdate } from './actions'
import { taxonomyCreate } from './actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsLoad]: (state, { taxonomies }) => taxonomies,

  // create
  [taxonomyCreate]: (state, { taxonomy }) => R.assoc(Taxonomy.getUuid(taxonomy), taxonomy)(state),

  // update
  [taxonomyUpdate]: (state, { taxonomy }) => R.assoc(Taxonomy.getUuid(taxonomy), taxonomy)(state),

  [taxonomiesUpdate]: (state, { taxonomies }) => taxonomies,

  [taxonomyPropUpdate]: (state, { taxonomy, key, value }) => R.pipe(
    R.assocPath([Taxonomy.getUuid(taxonomy), 'props', key], value),
    R.dissocPath([Taxonomy.getUuid(taxonomy), 'validation', 'fields', key]),
  )(state),

  // delete
  [taxonomyDelete]: (state, { taxonomy }) => R.dissoc(Taxonomy.getUuid(taxonomy))(state),
}

export default exportReducer(actionHandlers)