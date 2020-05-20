import * as R from 'ramda'

import { getState } from './read'
import { defaults } from './defaults'
import { keys, tableKeys } from './keys'

// ====== READ
const getTableProp = (tableProp, defaultValue = null) =>
  R.pipe(getState, R.pathOr(defaultValue, [keys.table, tableProp]))

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
export const hasTableAndCols = (state) => hasTable(state) && hasCols(state)

// ====== UPDATE
export const assocTableData = (offset, data) =>
  R.pipe(R.assocPath([keys.table, tableKeys.offset], offset), R.assocPath([keys.table, tableKeys.data], data))

export const assocNodeDefUuidCols = (nodeDefUuidCols) =>
  R.assocPath([keys.table, tableKeys.nodeDefUuidCols], nodeDefUuidCols)

export const assocTableSort = (sort) => R.assocPath([keys.table, tableKeys.sort], sort)

export const assocTableFilter = (filter) => R.assocPath([keys.table, tableKeys.filter], filter)

// On nodeDefUuid table change, reset table data, sort and filter
export const assocNodeDefUuidTable = (nodeDefUuidTable) =>
  R.pipe(
    R.assocPath([keys.table, tableKeys.nodeDefUuidTable], nodeDefUuidTable),
    assocTableData(defaults.offset, defaults.data),
    assocNodeDefUuidCols(defaults.nodeDefUuidCols),
    assocTableSort(defaults.sort),
    assocTableFilter(defaults.filter)
  )

export const assocTableDataCol = (data) => (state) =>
  R.pipe(
    R.pathOr([{}], [keys.table, tableKeys.data]),
    (dataState) => dataState.map((d, i) => R.mergeDeepLeft(d, data[i])),
    (dataUpdate) => assocTableData(R.pathOr(0, [keys.table, tableKeys.offset], state), dataUpdate)(state)
  )(state)

export const dissocTableDataCols = (cols) => (state) =>
  R.pipe(
    R.pathOr([{}], [keys.table, tableKeys.data]),
    (dataState) => dataState.map(R.omit(cols)),
    (dataUpdate) => assocTableData(R.pathOr(0, [keys.table, tableKeys.offset], state), dataUpdate)(state)
  )(state)

export const initTableData = (offset, limit, filter, sort, count, data, nodeDefUuidTable, nodeDefUuidCols, editMode) =>
  R.assoc(keys.table, {
    offset,
    limit,
    filter,
    sort,
    count,
    data,
    nodeDefUuidTable,
    nodeDefUuidCols,
    editMode,
  })
