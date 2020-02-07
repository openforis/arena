import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import { appPropsChange, appUserLogout } from '@webapp/app/actions'

// Survey actions
import { surveyCreate, surveyDelete, surveyUpdate } from '../actions'

// SurveyInfo actions

// nodeDefs actions
import { nodeDefCreate, nodeDefUpdate, nodeDefDelete } from '../nodeDefs/actions'

// Category actions
import { categoryCreate, categoryDelete, categoryUpdate } from '../categories/actions'

// Taxonomies actions
import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomies/actions'

// Processing chain actions
import { processingChainSave, processingChainDelete } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { processingStepDelete } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import { processingStepCalculationDelete } from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

import { surveyInfoUpdate, surveyInfoValidationUpdate } from './actions'
import * as SurveyInfoState from './surveyInfoState'

const actionHandlers = {
  // App initialization
  [appPropsChange]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [appUserLogout]: () => ({}),

  // Survey Update
  [surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyDelete]: () => ({}),

  // Survey info update
  [surveyInfoUpdate]: (state, { surveyInfo }) => surveyInfo,

  [surveyInfoValidationUpdate]: (state, { validation }) => SurveyInfoState.assocValidation(validation)(state),

  // NodeDef
  [nodeDefCreate]: SurveyInfoState.markDraft,
  [nodeDefUpdate]: SurveyInfoState.markDraft,
  [nodeDefDelete]: SurveyInfoState.markDraft,

  // Category
  [categoryCreate]: SurveyInfoState.markDraft,
  [categoryUpdate]: SurveyInfoState.markDraft,
  [categoryDelete]: SurveyInfoState.markDraft,

  // Taxonomy
  [taxonomyCreate]: SurveyInfoState.markDraft,
  [taxonomyUpdate]: SurveyInfoState.markDraft,
  [taxonomyPropUpdate]: SurveyInfoState.markDraft,
  [taxonomyDelete]: SurveyInfoState.markDraft,

  // Processing chain
  [processingChainSave]: SurveyInfoState.markDraft,
  [processingChainDelete]: SurveyInfoState.markDraft,
  [processingStepDelete]: SurveyInfoState.markDraft,
  [processingStepCalculationDelete]: SurveyInfoState.markDraft,
}

export default exportReducer(actionHandlers)
