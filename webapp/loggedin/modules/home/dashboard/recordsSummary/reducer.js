import { exportReducer } from '../../../../../utils/reduxUtils'

import * as RecordsSummaryState from './recordsSummaryState'

import { appUserLogout } from '../../../../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../../survey/actions'
import { recordsSummaryUpdate } from './actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // records summary
  [recordsSummaryUpdate]: (state, { from, to, counts }) => RecordsSummaryState.assocSummary(from, to, counts)(state)

}

export default exportReducer(actionHandlers)
