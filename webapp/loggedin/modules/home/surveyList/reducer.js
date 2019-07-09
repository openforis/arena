import { exportReducer } from '../../../../utils/reduxUtils'

import { appUserLogout } from '../../../../app/actions'

import { homeSurveyListResetState, homeSurveyListSurveysUpdate } from './actions'

import * as SurveyListState from './surveyListState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [homeSurveyListSurveysUpdate]: (state, { surveys }) => SurveyListState.assocSurveys(surveys)(state),

  [homeSurveyListResetState]: (state) => SurveyListState.resetState(state),
}

export default exportReducer(actionHandlers)