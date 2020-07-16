import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import * as SurveyActions from '../actions'
import * as TaxonomiesActions from './actions'

import * as TaxonomiesState from './state'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // Taxonomies
  [TaxonomiesActions.taxonomiesUpdate]: (state, { taxonomies }) => taxonomies,

  // Create
  [TaxonomiesActions.taxonomyCreate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  // Update
  [TaxonomiesActions.taxonomyUpdate]: (state, { taxonomy }) => TaxonomiesState.assocTaxonomy(taxonomy)(state),

  [TaxonomiesActions.taxonomyPropUpdate]: (state, { taxonomy, key, value }) =>
    TaxonomiesState.assocTaxonomyProp(taxonomy, key, value)(state),

  // Delete
  [TaxonomiesActions.taxonomyDelete]: (state, { taxonomy }) => TaxonomiesState.dissocTaxonomy(taxonomy)(state),
}

export default exportReducer(actionHandlers)
