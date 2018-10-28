import * as R from 'ramda'

import { assocActionProps, exportReducer, } from '../../appUtils/reduxUtils'

import { getSurveyInfo } from '../../../common/survey/survey'

import { surveyCurrentUpdate } from '../actions'

const actionHandlers = {
  [surveyCurrentUpdate]: (state, {survey}) => getSurveyInfo(survey)
}

export default exportReducer(actionHandlers)