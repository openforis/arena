import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import { SystemActionTypes } from '@webapp/store/system/actionTypes'

import * as SurveyActions from '../actions'
import * as SurveyInfoActions from './actions'
import { NodeDefsActions } from '../nodeDefs'

import * as SurveyInfoState from './state'

const actionHandlers = {
  // App initialization
  [SystemActionTypes.SYSTEM_INIT]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  // Survey Update
  [SurveyActions.surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyDelete]: () => ({}),

  // Survey info update
  [SurveyInfoActions.surveyInfoUpdate]: (state, { surveyInfo }) => surveyInfo,
  [SurveyInfoActions.surveyInfoValidationUpdate]: (state, { validation }) =>
    SurveyInfoState.assocValidation(validation)(state),

  // Chain/Analysis
  [SurveyActions.surveyChainSave]: SurveyInfoState.markDraft,
  [SurveyActions.surveyChainItemDelete]: SurveyInfoState.markDraft,

  // NodeDef
  [NodeDefsActions.nodeDefCreate]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefDelete]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefsDelete]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefSave]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefUpdate]: SurveyInfoState.markDraft,

  // Category
  // Taxonomy
  [SurveyActions.surveyMetaUpdated]: SurveyInfoState.markDraft,
}

export default exportReducer(actionHandlers)
