import { assocActionProps, exportReducer, } from '../../appUtils/reduxUtils'

import { assocSurveyInfo } from './surveyInfoState'

import { surveyCurrentUpdate } from '../actions'

const actionHandlers = {
  [surveyCurrentUpdate]: (state, {survey}) => survey.info,
}

export default exportReducer(actionHandlers)