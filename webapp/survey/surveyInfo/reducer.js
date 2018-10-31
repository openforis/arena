import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { getSurveyInfo } from '../../../common/survey/survey'

// survey actions
import {
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

const actionHandlers = {
  // Survey Update
  [surveyUpdate]: (state, {survey}) => getSurveyInfo(survey),

  [surveyPublish]: (state, _) => setPublished()(state),

  // survey info
  [surveyInfoPropUpdate]: (state, {key, value}) => assocSurveyInfoProp(key, value)(state),

  [surveyInfoValidationUpdate]: (state, {validation}) => assocSurveyInfoValidation(validation)(state),
}

export default exportReducer(actionHandlers)