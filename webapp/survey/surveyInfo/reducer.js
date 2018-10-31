import { exportReducer } from '../../appUtils/reduxUtils'

import { getSurveyInfo } from '../../../common/survey/survey'

import { assocSurveyInfoProp, assocSurveyInfoValidation, markDraft, markPublished } from './surveyInfoState'

// app actions
import { loginSuccess } from '../../login/actions'
import { appStatusChange } from '../../app/actions'

// survey actions
import { surveyCreate, surveyUpdate, surveyPublish } from '../actions'

// surveyInfo actions
import { surveyInfoPropUpdate, surveyInfoValidationUpdate } from './actions'

// nodeDefs actions
import { nodeDefCreate, nodeDefDelete, nodeDefPropUpdate, nodeDefUpdate } from '../nodeDefs/actions'

// codeList actions
import { codeListCreate, codeListDelete, codeListUpdate } from '../codeListEdit/actions'

// taxonomies actions
import { taxonomyCreate, taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomyEdit/actions'

const actionHandlers = {
  // app initialization
  [appStatusChange]: (state, {survey}) => getSurveyInfo(survey),
  [loginSuccess]: (state, {survey}) => getSurveyInfo(survey),

  // Survey Update
  [surveyCreate]: (state, {survey}) => getSurveyInfo(survey),
  [surveyUpdate]: (state, {survey}) => getSurveyInfo(survey),

  [surveyPublish]: markPublished,

  // survey info update
  [surveyInfoPropUpdate]: (state, {key, value}) => assocSurveyInfoProp(key, value)(state),

  [surveyInfoValidationUpdate]: (state, {validation}) => assocSurveyInfoValidation(validation)(state),

  //NODEDEF
  [nodeDefCreate]: markDraft,
  [nodeDefUpdate]: markDraft,
  [nodeDefPropUpdate]: markDraft,
  [nodeDefDelete]: markDraft,

  // CodeList
  [codeListCreate]: markDraft,
  [codeListUpdate]: markDraft,
  [codeListDelete]: markDraft,

  // taxonomies
  [taxonomyCreate]: markDraft,
  [taxonomyUpdate]: markDraft,
  [taxonomyPropUpdate]: markDraft,
  [taxonomyDelete]: markDraft,
}

export default exportReducer(actionHandlers)