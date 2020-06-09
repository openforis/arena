import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import { appPropsChange } from '@webapp/app/actions'
import { UserActions } from '@webapp/store/user'
// Processing chain actions
import { chainSave, chainDelete } from '@webapp/loggedin/modules/analysis/chain/actions'
import { stepDelete } from '@webapp/loggedin/modules/analysis/step/actions'
import { calculationDelete } from '@webapp/loggedin/modules/analysis/calculation/actions'

import * as SurveyActions from '../actions'
import * as SurveyInfoActions from './actions'
import { NodeDefsActions } from '../nodeDefs'
import { CategoriesActions } from '../categories'
import { TaxonomiesActions } from '../taxonomies'

import * as SurveyInfoState from './state'

const actionHandlers = {
  // App initialization
  [appPropsChange]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [UserActions.USER_INIT]: (state, { survey }) => (survey ? Survey.getSurveyInfo(survey) : state),
  [UserActions.USER_LOGOUT]: () => ({}),

  // Survey Update
  [SurveyActions.surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [SurveyActions.surveyDelete]: () => ({}),

  // Survey info update
  [SurveyInfoActions.surveyInfoUpdate]: (state, { surveyInfo }) => surveyInfo,
  [SurveyInfoActions.surveyInfoValidationUpdate]: (state, { validation }) =>
    SurveyInfoState.assocValidation(validation)(state),

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

  // Processing chain
  [chainSave]: SurveyInfoState.markDraft,
  [chainDelete]: SurveyInfoState.markDraft,
  [stepDelete]: SurveyInfoState.markDraft,
  [calculationDelete]: SurveyInfoState.markDraft,
}

export default exportReducer(actionHandlers)
