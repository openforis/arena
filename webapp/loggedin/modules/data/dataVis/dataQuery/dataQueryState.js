import * as R from 'ramda'
import * as DataVisState from '../dataVisState'

import Record from '../../../../../../common/record/record'
import Node from '../../../../../../common/record/node'
import Validation from '../../../../../../common/validation/validation'

export const defaults = {
  offset: 0,
  limit: 15,
  data: [],
  filter: null,
  nodeDefUuidCols: [],
  sort: [],
}

const getState = R.pipe(DataVisState.getState, R.prop('query'))

const keys = {
  table: 'table',
  showNodeDefSelectors: 'showNodeDefSelectors',
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

const rowKeys = {
  record: 'record'
}

// ====== table
const getTableProp = (tableProp, defaultValue = null) => R.pipe(
  getState,
  R.pathOr(defaultValue, [keys.table, tableProp])
)

export const getTableData = getTableProp(tableKeys.data, [])
export const getTableOffset = getTableProp(tableKeys.offset)
export const getTableLimit = getTableProp(tableKeys.limit)
export const getTableCount = getTableProp(tableKeys.count)
export const getTableFilter = getTableProp(tableKeys.filter)
export const getTableSort = getTableProp(tableKeys.sort, [])
export const getTableNodeDefUuidTable = getTableProp(tableKeys.nodeDefUuidTable)
export const getTableNodeDefUuidCols = getTableProp(tableKeys.nodeDefUuidCols, [])
export const getTableEditMode = getTableProp(tableKeys.editMode, false)

const hasTable = R.pipe(getTableNodeDefUuidTable, R.isNil, R.not)
const hasCols = R.pipe(getTableNodeDefUuidCols, R.isEmpty, R.not)
export const hasTableAndCols = state => hasTable(state) && hasCols(state)

// on nodeDefUuid table change, reset table data, sort and filter
export const assocNodeDefUuidTable = nodeDefUuidTable => R.pipe(
  R.assocPath([keys.table, tableKeys.nodeDefUuidTable], nodeDefUuidTable),
  assocTableData(defaults.offset, defaults.data),
  assocNodeDefUuidCols(defaults.nodeDefUuidCols),
  assocTableSort(defaults.sort),
  assocTableFilter(defaults.filter),
)

export const assocNodeDefUuidCols = (nodeDefUuidCols) =>
  R.assocPath([keys.table, tableKeys.nodeDefUuidCols], nodeDefUuidCols)

export const assocTableDataCol = data => state => R.pipe(
  R.pathOr([{}], [keys.table, tableKeys.data]),
  dataState => dataState.map((d, i) => R.mergeDeepLeft(d, data[i])),
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

// ===== Edit mode

export const assocTableDataRecordNodes = nodes => state => {
  // replace nodes in table rows
  const data = R.pathOr([], [keys.table, tableKeys.data], state)

  for (const node of R.values(nodes)) {
    const nodeDefUuid = Node.getNodeDefUuid(node)
    const nodeRecordUuid = Node.getRecordUuid(node)

    for (const row of data) {
      if (Record.getUuid(row.record) === nodeRecordUuid) {
        const cell = row.cols[nodeDefUuid]

        if (cell && Node.isEqual(node)(cell.node)) {
          row.cols[nodeDefUuid] = R.ifElse(
            R.always(Node.isDeleted(node)),
            R.dissoc('node'),
            R.assoc('node', node)
          )(cell)

        }
      }
    }
  }
  return R.assocPath([keys.table, tableKeys.data], data, state)
}

export const assocTableDataRecordNodeValidations = (recordUuid, recordValid) => state => R.pipe(
  R.pathOr([], [keys.table, tableKeys.data]),
  R.map(row =>
    R.ifElse(
      R.pathEq([rowKeys.record, Record.keys.uuid], recordUuid),
      R.assocPath([rowKeys.record, Validation.keys.validation, Validation.keys.valid], recordValid),
      R.identity
    )(row)
  ),
  data => R.assocPath([keys.table, tableKeys.data], data)(state)
)(state)

// ====== nodeDefSelectors

export const isNodeDefSelectorsVisible = R.pipe(getState, R.propOr(true, keys.showNodeDefSelectors))
export const assocShowNodeDefSelectors = R.assoc(keys.showNodeDefSelectors)
