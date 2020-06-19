import * as R from 'ramda'

import { getState } from './read'
import { defaults } from './defaults'
import { keys, tableKeys, modes } from './keys'

// ====== READ
const getTableProp = (tableProp, defaultValue = null) =>
  R.pipe(getState, R.pathOr(defaultValue, [keys.table, tableProp]))

export const getTableData = getTableProp(tableKeys.data, defaults.data)
export const getTableOffset = getTableProp(tableKeys.offset)
export const getTableLimit = getTableProp(tableKeys.limit)
export const getTableCount = getTableProp(tableKeys.count)
export const getTableFilter = getTableProp(tableKeys.filter)
export const getTableSort = getTableProp(tableKeys.sort, defaults.sort)
export const getTableNodeDefUuidTable = getTableProp(tableKeys.nodeDefUuidTable)
export const getTableNodeDefUuidCols = getTableProp(tableKeys.nodeDefUuidCols, defaults.nodeDefUuidCols)
export const getTableDimensions = getTableProp(tableKeys.dimensions, defaults.dimensions)
export const getTableMeasures = getTableProp(tableKeys.measures, defaults.measures)
export const getTableMode = getTableProp(tableKeys.mode)
const _isMode = (mode) => R.pipe(getTableMode, R.equals(mode))
export const isTableModeEdit = _isMode(modes.edit)
export const isTableModeAggregate = _isMode(modes.aggregate)

const hasTable = R.pipe(getTableNodeDefUuidTable, R.isNil, R.not)
const hasCols = R.pipe(getTableNodeDefUuidCols, R.isEmpty, R.not)
export const hasTableAndCols = (state) => hasTable(state) && hasCols(state)

// ====== UPDATE
export const assocTableData = (offset, data) =>
  R.pipe(R.assocPath([keys.table, tableKeys.offset], offset), R.assocPath([keys.table, tableKeys.data], data))
export const assocNodeDefUuidCols = R.assocPath([keys.table, tableKeys.nodeDefUuidCols])
export const assocDimensions = R.assocPath([keys.table, tableKeys.dimensions])
export const assocMeasures = R.assocPath([keys.table, tableKeys.measures])
export const assocTableSort = R.assocPath([keys.table, tableKeys.sort])
export const assocTableFilter = R.assocPath([keys.table, tableKeys.filter])

// On nodeDefUuid table change, reset table data, sort and filter
export const assocNodeDefUuidTable = (nodeDefUuidTable) =>
  R.pipe(
    R.assocPath([keys.table, tableKeys.nodeDefUuidTable], nodeDefUuidTable),
    assocTableData(defaults.offset, defaults.data),
    assocNodeDefUuidCols(defaults.nodeDefUuidCols),
    assocDimensions(defaults.dimensions),
    assocMeasures(defaults.measures),
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

export const initTableData = R.assoc(keys.table)
