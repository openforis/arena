import * as R from 'ramda'

export const keys = {
  columns: 'columns',
  filePath: 'filePath',
}

export const keysColumn = {
  dataType: 'dataType',
  lang: 'lang',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
  name: 'name',
  type: 'type',
}

export const columnTypes = {
  code: 'code',
  description: 'description',
  extra: 'extra',
  label: 'label',
}

// ===== SUMMARY

export const newSummary = ({ columns, filePath = null }) => ({
  [keys.columns]: columns,
  [keys.filePath]: filePath,
})

export const getColumns = R.propOr({}, keys.columns)

export const getFilePath = R.prop(keys.filePath)

// ===== COLUMN

export const newColumn = ({ type, levelName = null, levelIndex = -1, lang = null, dataType = null }) => ({
  [keysColumn.type]: type,
  [keysColumn.levelName]: levelName,
  [keysColumn.levelIndex]: levelIndex,
  [keysColumn.lang]: lang,
  [keysColumn.dataType]: dataType,
})

export const getColumnType = R.prop(keysColumn.type)

export const getColumnLevelName = R.prop(keysColumn.levelName)

export const getColumnLevelIndex = R.prop(keysColumn.levelIndex)

export const getColumnLang = R.prop(keysColumn.lang)

export const getColumnDataType = R.prop(keysColumn.dataType)

const isColumnType = (type) => R.pipe(getColumnType, R.equals(type))

export const isColumnCode = isColumnType(columnTypes.code)
export const isColumnExtra = isColumnType(columnTypes.extra)
export const isColumnLabel = isColumnType(columnTypes.label)
export const isColumnDescription = isColumnType(columnTypes.description)

export const hasColumnLang = (column) => isColumnLabel(column) || isColumnDescription(column)

// ===== UTILS

export const getLevelNames = R.pipe(getColumns, R.values, R.filter(isColumnCode), R.map(getColumnLevelName))

export const getColumnName = (type, levelIndex) =>
  R.pipe(
    getColumns,
    Object.values,
    R.find((column) => getColumnType(column) === type && getColumnLevelIndex(column) === levelIndex),
    (entry) => (entry ? entry[0] : null)
  )

export const hasColumn = (type, levelIndex) => R.pipe(getColumnName(type, levelIndex), R.isNil, R.not)

// UPDATE
export const assocColumns = R.assoc(keys.columns)
export const assocColumnDataType = (columnName, dataType) =>
  R.assocPath([keys.columns, columnName, keysColumn.dataType], dataType)
