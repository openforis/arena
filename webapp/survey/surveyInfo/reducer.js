import {exportReducer} from '@webapp/utils/reduxUtils'

import * as Survey from '@core/survey/survey'

// App actions
import {appPropsChange, appUserLogout} from '@webapp/app/actions'

// Survey actions
import {surveyCreate, surveyDelete, surveyUpdate} from '../actions'

// SurveyInfo actions

// nodeDefs actions
import {nodeDefCreate, nodeDefDelete, nodeDefPropsUpdate} from '../nodeDefs/actions'

// Category actions
import {categoryCreate} from '../categories/actions'

// Taxonomies actions
import {taxonomyCreate} from '../taxonomies/actions'
import {categoryDelete, categoryUpdate} from '../categories/actions'
import {taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate} from '../taxonomies/actions'
import {surveyInfoUpdate, surveyInfoValidationUpdate} from './actions'
import * as SurveyInfoState from './surveyInfoState'

const actionHandlers = {
  // App initialization
  [appPropsChange]: (state, {survey}) => survey ? Survey.getSurveyInfo(survey) : state,
  [appUserLogout]: () => ({}),

  // Survey Update
  [surveyCreate]: (state, {survey}) => Survey.getSurveyInfo(survey),
  [surveyUpdate]: (state, {survey}) => Survey.getSurveyInfo(survey),
  [surveyDelete]: () => ({}),

  // Survey info update
  [surveyInfoUpdate]: (state, {surveyInfo}) => surveyInfo,

  [surveyInfoValidationUpdate]: (state, {validation}) => SurveyInfoState.assocValidation(validation)(state),

  // NodeDef
  [nodeDefCreate]: SurveyInfoState.markDraft,
  [nodeDefPropsUpdate]: SurveyInfoState.markDraft,
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
}

export default exportReducer(actionHandlers)
