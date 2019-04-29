import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate, surveyCollectImportReportPresentUpdate } from '../actions'

import * as SurveyState from '../surveyState'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsLoad]: (state, { draft }) => SurveyState.setSurveyDefsFetched(draft)(state),

  [surveyCollectImportReportPresentUpdate]: (state, {present}) => SurveyState.setHasCollectImportReport(present)(state)
}

export default exportReducer(actionHandlers)