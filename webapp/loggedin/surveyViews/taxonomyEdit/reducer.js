import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import { taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import * as TaxonomyEditState from './taxonomyEditState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyEditUpdate]: (_state, { taxonomyUuid }) => TaxonomyEditState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyEditPropsUpdate]: (state, { type, ...props }) => TaxonomyEditState.mergeTaxonomyEditProps(props)(state),
}

export default exportReducer(actionHandlers)
