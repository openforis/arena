const R = require('ramda')

const keys = {
  recordUuid: 'recordUuid',
  initRecord: 'initRecord',
}

module.exports = {
  keys,

  getRecordUuid: R.prop(keys.recordUuid),
  getInitRecord: R.propOr(false, keys.initRecord),
}