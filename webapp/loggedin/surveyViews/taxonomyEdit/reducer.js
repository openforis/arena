import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyEditState from './taxonomyEditState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import { taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import { taxonomyCreate } from '@webapp/survey/taxonomies/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyEditUpdate]: (state, { taxonomyUuid }) => TaxonomyEditState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyEditPropsUpdate]: (state, { type, ...props }) => TaxonomyEditState.mergeTaxonomyEditProps(props)(state),

  // create
  [taxonomyCreate]: (state, { taxonomy }) => TaxonomyEditState.initTaxonomyEdit(Taxonomy.getUuid(taxonomy)),
}

export default exportReducer(actionHandlers)