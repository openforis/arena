import * as R from 'ramda'
import * as DataState from '../dataState'

const getDataVis = R.pipe(DataState.getData, R.prop('dataVis'))

const keys = {
  table: 'table',
}

const tableKeys = {
  data: 'data',
  offset: 'offset',
  limit: 'limit',
  count: 'count',
  filter: 'filter',
  nodeDefUuidTable: 'nodeDefUuidTable',
  nodeDefUuidCols: 'nodeDefUuidCols',
}

const getTableProp = (tableProp, defaultValue = null) => R.pipe(
  getDataVis,
  R.pathOr(defaultValue, [keys.table, tableProp])
)

export const getTableData = getTableProp(tableKeys.data, [])
export const getTableOffset = getTableProp(tableKeys.offset)
export const getTableLimit = getTableProp(tableKeys.limit)
export const getTableCount = getTableProp(tableKeys.count)
export const getTableFilter = getTableProp(tableKeys.filter, '')
export const getTableNodeDefUuidTable = getTableProp(tableKeys.nodeDefUuidTable)
export const getTableNodeDefUuidCols = getTableProp(tableKeys.nodeDefUuidCols, [])

export const initTableData = (offset, limit, filter, count, data, nodeDefUuidTable, nodeDefUuidCols) =>
  R.assoc(keys.table, { offset, limit, filter, count, data, nodeDefUuidTable, nodeDefUuidCols })

export const updateTableData = (offset, data) => R.pipe(
  R.assocPath([keys.table, tableKeys.offset], offset),
  R.assocPath([keys.table, tableKeys.data], data),
)

export const resetTableData = R.dissoc(keys.table)

export const updateTableFilter = filter => R.assocPath([keys.table, tableKeys.filter], filter)