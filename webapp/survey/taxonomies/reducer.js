import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate } from '../actions'
import * as TaxonomiesState from './taxonomiesState'

import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate, taxonomiesUpdate } from './actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  // Taxonomies
  [surveyDefsLoad]: (state, { taxonomies }) => taxonomies,
  [taxonomiesUpdate]: (state, { taxonomies }) => taxonomies,

  // Create
  [taxonomyCreate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  // Update
  [taxonomyUpdate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  [taxonomyPropUpdate]: (state, { taxonomy, key, value }) =>
    TaxonomiesState.assocTaxonomyProp(taxonomy, key, value)(state),

  // Delete
  [taxonomyDelete]: (state, { taxonomy }) => TaxonomiesState.dissocTaxonomy(taxonomy)(state),
}

export default exportReducer(actionHandlers)
