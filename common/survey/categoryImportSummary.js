const R = require('ramda')

const keys = {
  columns: 'columns',
  filePath: 'filePath',
}

const keysColumn = {
  name: 'name',
  type: 'type',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
}

const columnTypes = {
  code: 'code',
  label: 'label',
  description: 'description',
  extra: 'extra'
}

const columnDataTypes = {
  text: 'text',
  number: 'number',
}

// ===== SUMMARY

const newSummary = (columns, filePath) => ({
  [keys.columns]: columns,
  [keys.filePath]: filePath
})

const getColumns = R.propOr({}, keys.columns)

// ===== COLUMN

const newColumn = (type, levelName = null, levelIndex = -1) => ({
  [keysColumn.type]: type,
  [keysColumn.levelName]: levelName,
  [keysColumn.levelIndex]: levelIndex
})

const getColumnType = R.prop(keysColumn.type)

const getColumnLevelName = R.prop(keysColumn.levelName)

const getColumnLevelIndex = R.prop(keysColumn.levelIndex)

const isColumnType = type => R.pipe(
  getColumnType,
  R.equals(type)
)

const isColumnCode = isColumnType(columnTypes.code)

const isColumnExtra = isColumnType(columnTypes.extra)
const isColumnLabel = isColumnType(columnTypes.label)
const isColumnDescription = isColumnType(columnTypes.description)

// ===== UTILS

const getColumnNames = R.pipe(
  getColumns,
  R.values,
  R.filter(column => getColumnType(column) === columnTypes.code),
  R.map(getColumnLevelName)
)

const getColumnName = (type, levelIndex) => summary => {
  const columns = getColumns(summary)
  return R.pipe(
    R.keys,
    R.find(name => {
      const column = columns[name]
      return getColumnType(column) === type && getColumnLevelIndex(column) === levelIndex
    })
  )(columns)
}

module.exports = {
  columnTypes,
  columnDataTypes,

  newSummary,
  getColumns,
  getFilePath: R.prop(keys.filePath),

  // ==== column
  newColumn,

  getColumnType,
  getColumnLevelName,
  getColumnLevelIndex,
  isColumnCode,
  isColumnExtra,
  isColumnLabel,
  isColumnDescription,

  // ==== utils
  getColumnNames,
  getColumnName,
}