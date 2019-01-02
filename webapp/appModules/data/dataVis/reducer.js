import { exportReducer } from '../../../appUtils/reduxUtils'

import { dataVisTableInit, dataVisTableReset, dataVisTableUpdate } from './actions'

import * as DataVisState from './dataVisState'

const actionHandlers = {

  [dataVisTableInit]: (state, {offset, limit, count, data, nodeDefUuidTable, nodeDefUuidCols}) =>
    DataVisState.initTableData(
      offset, limit, count, data,
      nodeDefUuidTable, nodeDefUuidCols
    )(state),

  [dataVisTableUpdate]: (state, {offset, data}) =>
    DataVisState.updateTableData(offset, data)(state),

  [dataVisTableReset]: (state) =>
    DataVisState.resetTableData(state),

}

export default exportReducer(actionHandlers)