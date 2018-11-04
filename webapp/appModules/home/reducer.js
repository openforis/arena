import { assocActionProps, dissocStateProps, exportReducer } from '../../appUtils/reduxUtils'
import { surveyCreate } from '../../survey/actions'
import { homeNewSurveyUpdate } from './actions'
import { homeSurveysUpdate } from './actions'

const actionHandlers = {

  [surveyCreate]: (state, _) => dissocStateProps(state, ['newSurvey']),

  [homeNewSurveyUpdate]: assocActionProps,

  [homeSurveysUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)