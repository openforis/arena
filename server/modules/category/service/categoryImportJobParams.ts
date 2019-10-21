const R = require('ramda')

const keys = {
  categoryUuid: 'categoryUuid', //if category already exists
  categoryName: 'categoryName', //if category must be created
  summary: 'summary',
}

module.exports = {
  keys,

  getCategoryUuid: R.prop(keys.categoryUuid),
  getCategoryName: R.prop(keys.categoryName),
  getSummary: R.propOr({}, keys.summary),
}