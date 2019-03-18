import { exportReducer } from '../../appUtils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import { setSurveyDefsFetched, setHasCollectImportReport } from '../surveyState'

import { homeCollectImportReportUpdate } from '../../appModules/home/collectImportReport/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsLoad]: (state, { draft }) => setSurveyDefsFetched(draft)(state),

  [homeCollectImportReportUpdate]: (state, {items}) => setHasCollectImportReport(items.length > 0)(state)
}

export default exportReducer(actionHandlers)