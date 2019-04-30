import { exportReducer } from '../../utils/reduxUtils'

import * as TaxonomiesState from './taxonomiesState'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate, taxonomiesUpdate } from './actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // taxonomies
  [surveyDefsLoad]: (state, { taxonomies }) => taxonomies,
  [taxonomiesUpdate]: (state, { taxonomies }) => taxonomies,

  // create
  [taxonomyCreate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  // update
  [taxonomyUpdate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  [taxonomyPropUpdate]: (state, { taxonomy, key, value }) => TaxonomiesState.assocTaxonomyProp(taxonomy, key, value)(state),

  // delete
  [taxonomyDelete]: (state, { taxonomy }) => TaxonomiesState.dissocTaxonomy(taxonomy)(state),
}

export default exportReducer(actionHandlers)