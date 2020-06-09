import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import { SurveyActions } from '@webapp/store/survey'
import { formReset } from '../surveyForm/actions'

import { taxonomyViewTaxonomyPropsUpdate, taxonomyViewTaxonomyUpdate } from './actions'
import * as TaxonomyState from './taxonomyState'

const actionHandlers = {
  // Reset form
  [UserActions.APP_USER_LOGOUT]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyViewTaxonomyUpdate]: (_state, { taxonomyUuid }) => TaxonomyState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyViewTaxonomyPropsUpdate]: (state, { type, ...props }) => TaxonomyState.mergeTaxonomyEditProps(props)(state),
}

export default exportReducer(actionHandlers)
