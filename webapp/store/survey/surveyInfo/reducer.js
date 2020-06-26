import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import { SystemActions } from '@webapp/store/system'

import * as SurveyActions from '../actions'
import * as SurveyInfoActions from './actions'
import { NodeDefsActions } from '../nodeDefs'
import { CategoriesActions } from '../categories'
import { TaxonomiesActions } from '../taxonomies'

import * as SurveyInfoState from './state'

const actionHandlers = {
  // App initialization
  [SystemActions.SYSTEM_INIT]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [SystemActions.SYSTEM_RESET]: () => ({}),

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

  // NodeDef
  [NodeDefsActions.nodeDefCreate]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefDelete]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefSave]: SurveyInfoState.markDraft,
  [NodeDefsActions.nodeDefUpdate]: SurveyInfoState.markDraft,

  // Category
  [CategoriesActions.categoryCreate]: SurveyInfoState.markDraft,
  [CategoriesActions.categoryUpdate]: SurveyInfoState.markDraft,
  [CategoriesActions.categoryDelete]: SurveyInfoState.markDraft,

  // Taxonomy
  [TaxonomiesActions.taxonomyCreate]: SurveyInfoState.markDraft,
  [TaxonomiesActions.taxonomyUpdate]: SurveyInfoState.markDraft,
  [TaxonomiesActions.taxonomyPropUpdate]: SurveyInfoState.markDraft,
  [TaxonomiesActions.taxonomyDelete]: SurveyInfoState.markDraft,
}

export default exportReducer(actionHandlers)
