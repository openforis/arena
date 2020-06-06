import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import { appPropsChange, appUserLogout } from '@webapp/app/actions'
// Processing chain actions
import { chainSave, chainDelete } from '@webapp/loggedin/modules/analysis/chain/actions'
import { stepDelete } from '@webapp/loggedin/modules/analysis/step/actions'
import { calculationDelete } from '@webapp/loggedin/modules/analysis/calculation/actions'

import * as SurveyActions from '../actions'
import * as SurveyInfoActions from './actions'
import { nodeDefCreate, nodeDefDelete, nodeDefSave, nodeDefUpdate } from '../nodeDefs/actions'
import { CategoriesActions } from '../categories'
import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomies/actions'

import * as SurveyInfoState from './state'

const actionHandlers = {
  // App initialization
  [appPropsChange]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [appUserLogout]: () => ({}),

  // Survey Update
  [SurveyActions.surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyDelete]: () => ({}),

  // Survey info update
  [SurveyInfoActions.surveyInfoUpdate]: (state, { surveyInfo }) => surveyInfo,
  [SurveyInfoActions.surveyInfoValidationUpdate]: (state, { validation }) =>
    SurveyInfoState.assocValidation(validation)(state),

  // NodeDef
  [nodeDefCreate]: SurveyInfoState.markDraft,
  [nodeDefDelete]: SurveyInfoState.markDraft,
  [nodeDefSave]: SurveyInfoState.markDraft,
  [nodeDefUpdate]: SurveyInfoState.markDraft,

  // Category
  [CategoriesActions.categoryCreate]: SurveyInfoState.markDraft,
  [CategoriesActions.categoryUpdate]: SurveyInfoState.markDraft,
  [CategoriesActions.categoryDelete]: SurveyInfoState.markDraft,

  // Taxonomy
  [taxonomyCreate]: SurveyInfoState.markDraft,
  [taxonomyUpdate]: SurveyInfoState.markDraft,
  [taxonomyPropUpdate]: SurveyInfoState.markDraft,
  [taxonomyDelete]: SurveyInfoState.markDraft,

  // Processing chain
  [chainSave]: SurveyInfoState.markDraft,
  [chainDelete]: SurveyInfoState.markDraft,
  [stepDelete]: SurveyInfoState.markDraft,
  [calculationDelete]: SurveyInfoState.markDraft,
}

export default exportReducer(actionHandlers)
