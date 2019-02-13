const R = require('ramda')

const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
  expressions: 'expressions'
}

const dissocCount = R.dissoc(keys.count)

const cleanupCount = validations =>
  R.isEmpty(R.prop(keys.count, validations))
    ? dissocCount(validations)
    : validations

const assocMinMaxCount = (key, value) => R.pipe(
  R.ifElse(
    R.always(R.isEmpty(value)),
    R.dissocPath([keys.count, key]),
    R.assocPath([keys.count, key], value)
  ),
  cleanupCount
)

module.exports = {
  //REQUIRED
  isRequired: R.propOr(false, keys.required),
  assocRequired: required => R.assoc(keys.required, required),
  dissocRequired: R.dissoc(keys.required),

  //COUNT
  getMinCount: R.pathOr('', [keys.count, keys.min]),

  getMaxCount: R.pathOr('', [keys.count, keys.max]),

  assocMinCount: minCount => assocMinMaxCount(keys.min, minCount),

  assocMaxCount: maxCount => assocMinMaxCount(keys.max, maxCount),

  dissocCount,

  //EXPRESSIONS
  getExpressions: R.propOr([], (keys.expressions)),
  assocExpressions: expressions => R.assoc(keys.expressions, expressions),
}