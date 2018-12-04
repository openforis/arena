const R = require('ramda')

const categories = 'categories'

// ====== READ
const getCategories = R.pipe(
  R.prop(categories),
  R.defaultTo({})
)

const getCategoriesArray = R.pipe(
  getCategories,
  R.values,
)

const getCategoryByUuid = uuid => R.pipe(
  getCategories,
  R.prop(uuid)
)

// ====== UPDATE
const assocCategories = newCategories => R.assoc(categories, newCategories)

module.exports = {
  getCategories,
  getCategoriesArray,
  getCategoryByUuid,

  assocCategories,
}