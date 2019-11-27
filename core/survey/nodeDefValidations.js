import * as R from 'ramda'

import * as NumberUtils from '@core/numberUtils'

export const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
  expressions: 'expressions',
}

// COUNT
export const dissocCount = R.dissoc(keys.count)

const getCountProp = key => R.pathOr('', [keys.count, key])

export const getMinCount = getCountProp(keys.min)

export const getMaxCount = getCountProp(keys.max)

export const hasMinOrMaxCount = validations => {
  const minCount = NumberUtils.toNumber(getMinCount(validations))
  const maxCount = NumberUtils.toNumber(getMaxCount(validations))
  return !isNaN(minCount) || !isNaN(maxCount)
}

const assocCountProp = key => value =>
  R.pipe(
    R.ifElse(
      R.always(R.isEmpty(value)),
      R.dissocPath([keys.count, key]),
      R.assocPath([keys.count, key], value),
    ),
    // If validations count obj is empty, it gets removed from validations
    R.ifElse(R.pipe(R.prop(keys.count), R.isEmpty), dissocCount, R.identity),
  )

export const assocMinCount = assocCountProp(keys.min)
export const assocMaxCount = assocCountProp(keys.max)

// REQUIRED
export const isRequired = R.propOr(false, keys.required)
export const assocRequired = required => R.assoc(keys.required, required)
export const dissocRequired = R.dissoc(keys.required)

// EXPRESSIONS
export const getExpressions = R.propOr([], keys.expressions)
export const assocExpressions = expressions =>
  R.assoc(keys.expressions, expressions)
