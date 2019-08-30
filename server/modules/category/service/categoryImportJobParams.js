const R = require('ramda')

const keys = {
  categoryUuid: 'categoryUuid',
  summary: 'summary',
}

module.exports = {
  keys,

  getCategoryUuid: R.propOr({}, keys.categoryUuid),
  getSummary: R.propOr({}, keys.summary),
}