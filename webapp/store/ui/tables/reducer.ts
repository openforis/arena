import * as SurveyActionTypes from '@webapp/store/survey/actions/actionTypes'
import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'

import * as TablesActions from './actions'
import * as TablesState from './state'

const actionHandlers = {
  // Reset form
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [SurveyActionTypes.surveyCreate]: () => ({}),
  [SurveyActionTypes.surveyUpdate]: () => ({}),
  [SurveyActionTypes.surveyDelete]: () => ({}),

  // Tables
  [TablesActions.tableVisibleColumnsUpdate]: (state, { module, visibleColumns }) =>
    TablesState.assocVisibleColumns({ module, visibleColumns })(state),

  [TablesActions.tableMaxRowsUpdate]: (state, { module, maxRows }) =>
    TablesState.assocMaxRows({ module, maxRows })(state),

  [TablesActions.tableSortUpdate]: (state, { module, sort }) => TablesState.assocSort({ module, sort })(state),
}

export default exportReducer(actionHandlers)
