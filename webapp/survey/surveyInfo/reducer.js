import { exportReducer } from '../../appUtils/reduxUtils'

import Survey from '../../../common/survey/survey'

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
import { codeListCreate } from '../codeLists/actions'

// taxonomies actions
import { taxonomyCreate } from '../taxonomies/actions'
import { codeListDelete, codeListUpdate } from '../codeLists/actions'
import { taxonomyDelete, taxonomyPropUpdate, taxonomyUpdate } from '../taxonomies/actions'

const actionHandlers = {
  // app initialization
  [appStatusChange]: (state, {survey}) => Survey.getSurveyInfo(survey),
  [loginSuccess]: (state, {survey}) => Survey.getSurveyInfo(survey),

  // Survey Update
  [surveyCreate]: (state, {survey}) => Survey.getSurveyInfo(survey),
  [surveyUpdate]: (state, {survey}) => Survey.getSurveyInfo(survey),

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