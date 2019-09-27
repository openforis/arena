const R = require('ramda')

const keys = {
  recordUuid: 'recordUuid',
}

module.exports = {
  keys,

  getRecordUuid: R.prop(keys.recordUuid),
}