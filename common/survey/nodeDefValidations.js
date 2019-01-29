const R = require('ramda')

const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
  expressions: 'expressions'
}

module.exports = {
  //REQUIRED
  isRequired: R.propOr(false, keys.required),
  assocRequired: required => R.assoc(keys.required, required),
  dissocRequired: R.dissoc(keys.required),

  //COUNT
  getMinCount: R.pathOr('', [keys.count, keys.min]),

  getMaxCount: R.pathOr('', [keys.count, keys.max]),

  assocMinCount: minCount => R.assocPath([keys.count, keys.min], minCount),
  assocMaxCount: maxCount => R.assocPath([keys.count, keys.max], maxCount),
  dissocCount: R.dissoc(keys.count),

  //EXPRESSIONS
  getExpressions: R.propOr([], (keys.expressions)),
  assocExpressions: expressions => R.assoc(keys.expressions, expressions),
}