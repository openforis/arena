import {exportReducer} from '@webapp/utils/reduxUtils'

import * as Taxonomy from '@core/survey/taxonomy'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'
import {taxonomyCreate} from '@webapp/survey/taxonomies/actions'
import {formReset} from '../surveyForm/actions'

import {taxonomyEditPropsUpdate, taxonomyEditUpdate} from './actions'
import * as TaxonomyEditState from './taxonomyEditState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyEditUpdate]: (state, {taxonomyUuid}) =>
    TaxonomyEditState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyEditPropsUpdate]: (state, {type, ...props}) =>
    TaxonomyEditState.mergeTaxonomyEditProps(props)(state),

  // Create
  [taxonomyCreate]: (state, {taxonomy}) =>
    TaxonomyEditState.initTaxonomyEdit(Taxonomy.getUuid(taxonomy)),
}

export default exportReducer(actionHandlers)
