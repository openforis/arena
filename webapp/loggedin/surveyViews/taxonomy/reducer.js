import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { SurveyActions } from '@webapp/store/survey'
import { formReset } from '../surveyForm/actions'

import { taxonomyViewTaxonomyPropsUpdate, taxonomyViewTaxonomyUpdate } from './actions'
import * as TaxonomyState from './taxonomyState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyViewTaxonomyUpdate]: (_state, { taxonomyUuid }) => TaxonomyState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyViewTaxonomyPropsUpdate]: (state, { type, ...props }) => TaxonomyState.mergeTaxonomyEditProps(props)(state),
}

export default exportReducer(actionHandlers)
