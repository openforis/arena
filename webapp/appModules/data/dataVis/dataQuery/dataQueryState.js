import * as R from 'ramda'
import * as DataVisState from '../dataVisState'

import Node from '../../../../../common/record/node'

const getState = R.pipe(DataVisState.getState, R.prop('query'))

const keys = {
  table: 'table',
}

const tableKeys = {
  data: 'data',
  offset: 'offset',
  limit: 'limit',
  count: 'count',
  filter: 'filter',
  sort: 'sort',
  nodeDefUuidTable: 'nodeDefUuidTable',
  nodeDefUuidCols: 'nodeDefUuidCols',
  editMode: 'editMode',
}

// table
const getTableProp = (tableProp, defaultValue = null) => R.pipe(
  getState,
  R.pathOr(defaultValue, [keys.table, tableProp])
)

export const getTableData = getTableProp(tableKeys.data, [])
export const getTableOffset = getTableProp(tableKeys.offset)
export const getTableLimit = getTableProp(tableKeys.limit)
export const getTableCount = getTableProp(tableKeys.count)
export const getTableFilter = getTableProp(tableKeys.filter, '')
export const getTableSort = getTableProp(tableKeys.sort, [])
export const getTableNodeDefUuidTable = getTableProp(tableKeys.nodeDefUuidTable)
export const getTableNodeDefUuidCols = getTableProp(tableKeys.nodeDefUuidCols, [])
export const getTableEditMode = getTableProp(tableKeys.editMode, false)

const hasTable = R.pipe(getTableNodeDefUuidTable, R.isNil, R.not)
const hasCols = R.pipe(getTableNodeDefUuidCols, R.isEmpty, R.not)
export const hasTableAndCols = state => hasTable(state) && hasCols(state)

export const assocNodeDefUuidTable = nodeDefUuidTable =>
  R.assocPath([keys.table, tableKeys.nodeDefUuidTable], nodeDefUuidTable)

export const assocNodeDefUuidCols = (nodeDefUuidCols) =>
  R.assocPath([keys.table, tableKeys.nodeDefUuidCols], nodeDefUuidCols)

export const assocTableDataCol = data => state => R.pipe(
  R.pathOr([{}], [keys.table, tableKeys.data]),
  dataState => dataState.map((d, i) => R.mergeLeft(d, data[i])),
  dataUpdate => assocTableData(
    R.pathOr(0, [keys.table, tableKeys.offset], state),
    dataUpdate
  )(state),
)(state)

export const dissocTableDataCols = cols => state => R.pipe(
  R.pathOr([{}], [keys.table, tableKeys.data]),
  dataState => dataState.map(R.omit(cols)),
  dataUpdate => assocTableData(
    R.pathOr(0, [keys.table, tableKeys.offset], state),
    dataUpdate
  )(state),
)(state)

export const initTableData = (offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode) =>
  R.assoc(keys.table, { offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode })

export const assocTableData = (offset, data) => R.pipe(
  R.assocPath([keys.table, tableKeys.offset], offset),
  R.assocPath([keys.table, tableKeys.data], data)
)

export const assocTableFilter = filter => R.assocPath([keys.table, tableKeys.filter], filter)

export const assocTableSort = sort => R.assocPath([keys.table, tableKeys.sort], sort)

export const assocTableDataRecordNodes = nodes =>
  state => {
  const editMode = R.pathOr(false, [keys.table, tableKeys.editMode], state)
    if (editMode) {
      // replace nodes in table rows
      const data = R.pathOr([], [keys.table, tableKeys.data], state)
      for(const node of R.values(nodes)) {
        const nodeUuid = Node.getUuid(node)
        for (const row of data) {
          if (row.recordUuid === Node.getRecordUuid(node) && R.includes(nodeUuid, R.keys(row.nodes))) {
            // update node in table cell
            row.nodes[nodeUuid] = node
          }
        }
      }
      return R.assocPath([keys.table, tableKeys.data], data, state)
    } else {
      return state
    }
  }