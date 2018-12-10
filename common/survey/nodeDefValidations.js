const R = require('ramda')

const keys = {
  required: 'required',
  count: 'count',
  min: 'min',
  max: 'max',
}

module.exports = {
  getCount: R.prop(keys.count),
  isRequired: R.prop(keys.required),
  getMinCount: R.path([keys.count, keys.min]),
  getMaxCount: R.path([keys.count, keys.max]),

  assocRequired: required => R.assoc(keys.required, required),
  dissocRequired: R.dissoc(keys.required),
  assocMinCount: minCount => R.assocPath([keys.count, keys.min], minCount),
  dissocMinCount: R.dissocPath([keys.count, keys.min]),
  assocMaxCount: maxCount => R.assocPath([keys.count, keys.max], maxCount),
  dissocMaxCount: R.dissocPath([keys.count, keys.max]),

}