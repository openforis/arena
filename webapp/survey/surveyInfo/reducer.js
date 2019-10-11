import { exportReducer } from '../../utils/reduxUtils'

import Survey from '../../../core/survey/survey'

import * as SurveyInfoState from './surveyInfoState'

// app actions
import { appPropsChange, appUserLogout } from '../../app/actions'

// survey actions
import { surveyCreate, surveyDelete, surveyUpdate } from '../actions'

// surveyInfo actions
import { surveyInfoUpdate, surveyInfoValidationUpdate } from './actions'

// nodeDefs actions
import { nodeDefCreate, nodeDefDelete, nodeDefPropsUpdate } from '../nodeDefs/actions'

// category actions
import { categoryCreate } from '../categories/actions'

// taxonomies actions
import { taxonomyCreate } from '../taxonomies/actions'
import { categoryDelete, categoryUpdate } from '../categories/actions'
import { taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomies/actions'

const actionHandlers = {
  // app initialization
  [appPropsChange]: (state, { survey }) => survey ? Survey.getSurveyInfo(survey) : state,
  [appUserLogout]: () => ({}),

  // Survey Update
  [surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyDelete]: () => ({}),

  // survey info update
  [surveyInfoUpdate]: (state, { surveyInfo }) => surveyInfo,

  [surveyInfoValidationUpdate]: (state, { validation }) => SurveyInfoState.assocValidation(validation)(state),

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