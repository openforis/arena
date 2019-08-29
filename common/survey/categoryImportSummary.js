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

const newSummary = (headers, filePath) => ({
  [keys.headers]: headers,
  [keys.filePath]: filePath
})

const newHeader = (type, levelName, levelIndex = 0) => ({
  [keysHeader.type]: type,
  [keysHeader.levelName]: levelName,
  [keysHeader.levelIndex]: levelIndex
})

const getHeaders = R.propOr({}, keys.headers)

const getHeaderType = R.propOr(headerInfoTypeDefault, keysHeader.type)

const getHeaderLevelName = R.propOr(headerInfoTypeDefault, keysHeader.levelName)

module.exports = {
  headerTypes,
  headerDataTypes,

  newSummary,
  getHeaders,
  getLevelNames: R.pipe(
    getHeaders,
    R.values,
    R.filter(header => getHeaderType(header) === headerTypes.itemCode),
    R.map(getHeaderLevelName)
  ),
  getFilePath: R.prop(keys.filePath),
  getHeader: headerName => R.pathOr({}, [keys.headers, headerName]),
  assocHeader: (headerName, header) => R.assocPath([keys.headers, headerName], header),

  // ==== header
  newHeader,

  getHeaderType,
  getHeaderLevelName,
  getHeaderLevelIndex: R.prop(keysHeader.levelIndex),

}