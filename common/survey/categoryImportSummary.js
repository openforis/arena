const R = require('ramda')

const keys = {
  headers: 'headers',
  filePath: 'filePath',
}

const keysHeader = {
  name: 'name',
  type: 'type',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
}

const headerTypes = {
  itemCode: 'itemCode',
  itemLabel: 'itemLabel',
  itemDescription: 'itemDescription',
  extra: 'extra'
}

const headerDataTypes = {
  text: 'text',
  number: 'number',
}

const headerInfoTypeDefault = headerDataTypes.text

// ===== SUMMARY

const newSummary = (headers, filePath) => ({
  [keys.headers]: headers,
  [keys.filePath]: filePath
})

const getHeaders = R.propOr({}, keys.headers)

// ===== HEADER
const newHeader = (type, levelName, levelIndex = 0) => ({
  [keysHeader.type]: type,
  [keysHeader.levelName]: levelName,
  [keysHeader.levelIndex]: levelIndex
})

const getHeaderType = R.propOr(headerInfoTypeDefault, keysHeader.type)

const getHeaderLevelName = R.propOr(headerInfoTypeDefault, keysHeader.levelName)

const getHeaderLevelIndex = R.propOr(headerInfoTypeDefault, keysHeader.levelIndex)

// ===== UTILS
const getLevelNames = R.pipe(
  getHeaders,
  R.values,
  R.filter(header => getHeaderType(header) === headerTypes.itemCode),
  R.map(getHeaderLevelName)
)

const getHeaderName = (type, levelIndex) => summary => {
  const headers = getHeaders(summary)
  return R.pipe(
    R.keys,
    R.find(headerName => {
      const header = headers[headerName]
      return getHeaderType(header) === type && getHeaderLevelIndex(header) === levelIndex
    })
  )(headers)
}

module.exports = {
  headerTypes,
  headerDataTypes,

  newSummary,
  getHeaders,
  getFilePath: R.prop(keys.filePath),

  // ==== header
  newHeader,

  getHeaderType,
  getHeaderLevelName,
  getHeaderLevelIndex: R.prop(keysHeader.levelIndex),

  // ==== utils
  getLevelNames,
  getHeaderName,
}