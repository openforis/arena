import { exportReducer } from '../../appUtils/reduxUtils'

import { getSurveyInfo } from '../../../common/survey/survey'

// survey actions
import {
  surveyCreate,
  surveyUpdate,
  surveyPublish,
} from '../actions'

// surveyInfo actions
import {
  surveyInfoPropUpdate,
  surveyInfoValidationUpdate
} from './actions'

import {
  setPublished,
  assocSurveyInfoProp,
  assocSurveyInfoValidation,
} from './surveyInfoState'
import { loginSuccess } from '../../login/actions'
import { appStatusChange } from '../../app/actions'

const actionHandlers = {
  // app initialization
  [appStatusChange]: (state, {survey}) => getSurveyInfo(survey),
  [loginSuccess]: (state, {survey}) => getSurveyInfo(survey),

  // Survey Update
  [surveyCreate]: (state, {survey}) => getSurveyInfo(survey),
  [surveyUpdate]: (state, {survey}) => getSurveyInfo(survey),

  [surveyPublish]: (state, _) => setPublished()(state),

  // survey info
  [surveyInfoPropUpdate]: (state, {key, value}) => assocSurveyInfoProp(key, value)(state),

  [surveyInfoValidationUpdate]: (state, {validation}) => assocSurveyInfoValidation(validation)(state),
}

export default exportReducer(actionHandlers)