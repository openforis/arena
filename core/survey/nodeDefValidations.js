const R = require('ramda')

const NumberUtils = require('@core/numberUtils')

const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
  expressions: 'expressions'
}

const dissocCount = R.dissoc(keys.count)

const getCountProp = key => R.pathOr('', [keys.count, key])

const getMinCount = getCountProp(keys.min)

const getMaxCount = getCountProp(keys.max)

const hasMinOrMaxCount = validations => {
  const minCount = NumberUtils.toNumber(getMinCount(validations))
  const maxCount = NumberUtils.toNumber(getMaxCount(validations))
  return !isNaN(minCount) || !isNaN(maxCount)
}

const assocCountProp = key =>
  value => R.pipe(
    R.ifElse(
      R.always(R.isEmpty(value)),
      R.dissocPath([keys.count, key]),
      R.assocPath([keys.count, key], value)
    ),
    // if validations count obj is empty, it gets removed from validations
    R.ifElse(
      R.pipe(R.prop(keys.count), R.isEmpty),
      dissocCount,
      R.identity
    )
  )

module.exports = {
  keys,

  //REQUIRED
  isRequired: R.propOr(false, keys.required),
  assocRequired: required => R.assoc(keys.required, required),
  dissocRequired: R.dissoc(keys.required),

  //COUNT
  getMinCount,
  getMaxCount,
  hasMinOrMaxCount,

  assocMinCount: assocCountProp(keys.min),
  assocMaxCount: assocCountProp(keys.max),

  dissocCount,

  //EXPRESSIONS
  getExpressions: R.propOr([], (keys.expressions)),
  assocExpressions: expressions => R.assoc(keys.expressions, expressions),
}