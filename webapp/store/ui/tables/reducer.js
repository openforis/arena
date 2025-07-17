import { exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import { SystemActions } from '@webapp/store/system'

import * as TablesActions from './actions'
import * as TablesState from './state'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Tables
  [TablesActions.tableVisibleColumnsUpdate]: (state, { module, visibleColumns }) =>
    TablesState.assocVisibleColumns({ module, visibleColumns })(state),

  [TablesActions.tableMaxRowsUpdate]: (state, { module, maxRows }) =>
    TablesState.assocMaxRows({ module, maxRows })(state),
}

export default exportReducer(actionHandlers)
