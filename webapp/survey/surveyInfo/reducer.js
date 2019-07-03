import { exportReducer } from '../../utils/reduxUtils'

import Survey from '../../../common/survey/survey'

import * as SurveyInfoState from './surveyInfoState'

// app actions
import { appStatusChange, appUserLogout } from '../../app/actions'

// survey actions
import { surveyCreate, surveyDelete, surveyUpdate } from '../actions'

// surveyInfo actions
import { surveyInfoPropUpdate, surveyInfoValidationUpdate } from './actions'

// nodeDefs actions
import { nodeDefCreate, nodeDefDelete, nodeDefPropsUpdate, nodeDefUpdate } from '../nodeDefs/actions'

// category actions
import { categoryCreate } from '../categories/actions'

// taxonomies actions
import { taxonomyCreate } from '../taxonomies/actions'
import { categoryDelete, categoryUpdate } from '../categories/actions'
import { taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomies/actions'

const actionHandlers = {
  // app initialization
  [appStatusChange]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [appUserLogout]: () => ({}),

  // Survey Update
  [surveyCreate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyUpdate]: (state, { survey }) => Survey.getSurveyInfo(survey),
  [surveyDelete]: () => ({}),

  // survey info update
  [surveyInfoPropUpdate]: (state, { key, value }) => SurveyInfoState.assocSurveyInfoProp(key, value)(state),

  [surveyInfoValidationUpdate]: (state, { validation }) => SurveyInfoState.assocSurveyInfoValidation(validation)(state),

  // NodeDef
  [nodeDefCreate]: SurveyInfoState.markDraft,
  [nodeDefUpdate]: SurveyInfoState.markDraft,
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