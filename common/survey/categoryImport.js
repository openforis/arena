const R = require('ramda')

const keys = {
  headersInfo: 'headersInfo',
}

const keysHeaderInfo = {
  name: 'name',
  type: 'type',
  levelIndex: 'levelIndex',
}

const headerInfoTypes = {
  text: 'text',
  number: 'number',
}

const headerInfoTypeDefault = headerInfoTypes.text

const newHeaderInfo = (type, levelIndex) => ({
  [keysHeaderInfo.type]: type,
  [keysHeaderInfo.levelIndex]: levelIndex
})

module.exports = {
  getHeadersInfo: R.propOr({}, keys.headersInfo),
  getHeaderInfo: name => R.pathOr({}, [keys.headersInfo, name]),
  assocHeaderInfo: (name, info) => R.assocPath([keys.headersInfo, name], info),

  // ==== header info
  newHeaderInfo,

  getHeaderInfoType: R.propOr(headerInfoTypeDefault, keysHeaderInfo.type),
  getHeaderInfoLevelIndex: R.prop(keysHeaderInfo.levelIndex),

}