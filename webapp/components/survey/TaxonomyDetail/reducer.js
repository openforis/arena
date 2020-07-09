import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'

import { taxonomyViewTaxonomyPropsUpdate, taxonomyViewTaxonomyUpdate } from './actions'
import * as TaxonomyState from './taxonomyState'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [taxonomyViewTaxonomyUpdate]: (_state, { taxonomyUuid }) => TaxonomyState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyViewTaxonomyPropsUpdate]: (state, { type, ...props }) => TaxonomyState.mergeTaxonomyEditProps(props)(state),
}

export default exportReducer(actionHandlers)
