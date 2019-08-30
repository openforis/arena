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
  itemCode: 'itemCode',
  itemLabel: 'itemLabel',
  itemDescription: 'itemDescription',
  extra: 'extra'
}

const columnDataTypes = {
  text: 'text',
  number: 'number',
}

const columnDataTypeDefault = columnDataTypes.text

// ===== SUMMARY

const newSummary = (columns, filePath) => ({
  [keys.columns]: columns,
  [keys.filePath]: filePath
})

const getColumns = R.propOr({}, keys.columns)

// ===== COLUMN

const newColumn = (type, levelName, levelIndex = 0) => ({
  [keysColumn.type]: type,
  [keysColumn.levelName]: levelName,
  [keysColumn.levelIndex]: levelIndex
})

const getColumnType = R.propOr(columnDataTypeDefault, keysColumn.type)

const getColumnLevelName = R.propOr(columnDataTypeDefault, keysColumn.levelName)

const getColumnLevelIndex = R.propOr(columnDataTypeDefault, keysColumn.levelIndex)

// ===== UTILS

const getColumnNames = R.pipe(
  getColumns,
  R.values,
  R.filter(column => getColumnType(column) === columnTypes.itemCode),
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

  // ==== utils
  getColumnNames,
  getColumnName,
}