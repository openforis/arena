import { assocActionProps, exportReducer, } from '../../appUtils/reduxUtils'

import { assocSurveyInfo } from './surveyInfoState'

import { surveyCurrentUpdate } from '../actions'

const actionHandlers = {
  [surveyCurrentUpdate]: (state, {survey}) => assocSurveyInfo(survey)(state),
}

export default exportReducer(actionHandlers)