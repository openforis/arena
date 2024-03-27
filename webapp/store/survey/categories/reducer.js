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
  [SurveyActions.surveyDefsLoad]: (_state, { categories }) => categories,

  [SurveyActions.surveyCategoryDelete]: (state, { categoryUuid }) => State.dissocCategory(categoryUuid)(state),
  [SurveyActions.surveyCategoryInsert]: (state, { category }) => State.assocCategory(category)(state),
  [SurveyActions.surveyCategoryUpdate]: (state, { category }) => State.assocCategory(category)(state),
}

export default exportReducer(actionHandlers)
