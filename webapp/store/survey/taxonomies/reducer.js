import { SystemActions } from '@webapp/store/system'
import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SurveyActions from '../actions'

import * as State from './state'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefs load
  [SurveyActions.surveyDefsLoad]: (_state, { taxonomies }) => taxonomies,

  [SurveyActions.surveyTaxonomyDelete]: (state, { taxonomyUuid }) => State.dissocTaxonomy(taxonomyUuid)(state),
  [SurveyActions.surveyTaxonomyInsert]: (state, { taxonomy }) => State.assocTaxonomy(taxonomy)(state),
  [SurveyActions.surveyTaxonomyUpdate]: (state, { taxonomy }) => State.assocTaxonomy(taxonomy)(state),
}

export default exportReducer(actionHandlers)
