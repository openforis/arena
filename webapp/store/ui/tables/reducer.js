import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import * as TablesActions from './actions'
import * as TablesState from './state'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  // Tables
  [TablesActions.tableVisibleColumnsUpdate]: (state, { module, visibleColumns }) =>
    TablesState.assocVisibleColumns({ module, visibleColumns })(state),

  [TablesActions.tableMaxRowsUpdate]: (state, { module, maxRows }) =>
    TablesState.assocMaxRows({ module, maxRows })(state),
}

export default exportReducer(actionHandlers)
