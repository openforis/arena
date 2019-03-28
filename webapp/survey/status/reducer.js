import { exportReducer } from '../../appUtils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate, surveyCollectImportReportPresentUpdate } from '../actions'

import { setSurveyDefsFetched, setHasCollectImportReport } from '../surveyState'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsLoad]: (state, { draft }) => setSurveyDefsFetched(draft)(state),

  [surveyCollectImportReportPresentUpdate]: (state, {present}) => setHasCollectImportReport(present)(state)
}

export default exportReducer(actionHandlers)