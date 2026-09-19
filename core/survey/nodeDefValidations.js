import * as A from '@core/arena'

export const keys = {
  count: 'count',
  expressions: 'expressions',
  max: 'max',
  min: 'min',
  required: 'required',
  unique: 'unique',
}

// COUNT
export const dissocCount = A.dissoc(keys.count)

export const getCountProp = (key) => A.pathOr('', [keys.count, key])

export const getMinCount = getCountProp(keys.min)

export const getMaxCount = getCountProp(keys.max)

export const assocCountProp = (key) => (value) =>
  A.pipe(
    A.ifElse(A.always(A.isEmpty(value)), A.dissocPath([keys.count, key]), A.assocPath([keys.count, key], value)),
    // If validations count obj is empty, it gets removed from validations
    A.ifElse(A.pipe(A.prop(keys.count), A.isEmpty), dissocCount, A.identity)
  )

export const assocMinCount = assocCountProp(keys.min)
export const assocMaxCount = assocCountProp(keys.max)

// REQUIRED
export const isRequired = A.propOr(false, keys.required)
export const assocRequired = (required) => A.assoc(keys.required, required)
export const dissocRequired = A.dissoc(keys.required)

// UNIQUE
export const isUnique = A.propOr(false, keys.unique)
export const assocUnique = (unique) => A.assoc(keys.unique, unique)
export const dissocUnique = A.dissoc(keys.unique)

// EXPRESSIONS
export const getExpressions = A.propOr([], keys.expressions)
export const assocExpressions = (expressions) => A.assoc(keys.expressions, expressions)
