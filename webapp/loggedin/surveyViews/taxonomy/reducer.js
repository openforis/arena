import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import { taxonomyViewTaxonomyPropsUpdate, taxonomyViewTaxonomyUpdate } from './actions'
import * as TaxonomyState from './taxonomyState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyViewTaxonomyUpdate]: (_state, { taxonomyUuid }) => TaxonomyState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyViewTaxonomyPropsUpdate]: (state, { type, ...props }) => TaxonomyState.mergeTaxonomyEditProps(props)(state),
}

export default exportReducer(actionHandlers)
