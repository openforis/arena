const R = require('ramda')

const Category = require('../category')

const categories = 'categories'

// ====== READ
const getCategories = R.pipe(
  R.prop(categories),
  R.defaultTo({})
)

const getCategoriesArray = R.pipe(
  getCategories,
  R.values,
  //sort by name
  R.sort((category1, category2) => {
    const name1 = Category.getName(category1)
    const name2 = Category.getName(category2)

    return name1 < name2
      ? -1
      : name1 > name2
        ? 1
        : 0
  })
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