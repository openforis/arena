import { exportReducer } from '../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../app/actions'

import { dataVisTableInit, dataVisTableReset, dataVisTableUpdate, dataVisTableFilterUpdate } from './actions'

import * as DataVisState from './dataVisState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [dataVisTableInit]: (
    state,
    {offset, limit, filter, count, data, nodeDefUuidTable, nodeDefUuidCols}
  ) =>
    DataVisState.initTableData(
      offset, limit, filter, count, data,
      nodeDefUuidTable, nodeDefUuidCols
    )(state),

  [dataVisTableUpdate]: (state, {offset, data}) => DataVisState.updateTableData(offset, data)(state),

  [dataVisTableReset]: (state) => DataVisState.resetTableData(state),

  [dataVisTableFilterUpdate]: (state, {filter}) => DataVisState.updateTableFilter(filter)(state)
}

export default exportReducer(actionHandlers)