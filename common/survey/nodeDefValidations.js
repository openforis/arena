const R = require('ramda')

const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
}

module.exports = {
  //REQUIRED
  isRequired: R.prop(keys.required),
  assocRequired: required => R.assoc(keys.required, required),
  dissocRequired: R.dissoc(keys.required),

  //COUNT
  getMinCount: R.path([keys.count, keys.min]),
  getMaxCount: R.path([keys.count, keys.max]),
  assocMinCount: minCount => R.assocPath([keys.count, keys.min], minCount),
  assocMaxCount: maxCount => R.assocPath([keys.count, keys.max], maxCount),
  dissocCount: R.dissoc(keys.count),
}