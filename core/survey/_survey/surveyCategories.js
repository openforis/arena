import * as R from 'ramda'

import * as Category from '../category'

const categories = 'categories'

// ====== READ
export const getCategories = R.pipe(R.prop(categories), R.defaultTo({}))

export const getCategoriesArray = R.pipe(
  getCategories,
  R.values,
  // Sort by name
  R.sort((category1, category2) => {
    const name1 = Category.getName(category1)
    const name2 = Category.getName(category2)
    if (name1 < name2) return -1
    if (name1 > name2) return 1
    return 0
  })
)

export const getCategoryByUuid = (uuid) => R.pipe(getCategories, R.prop(uuid))

export const getCategoryByName = (name) =>
  R.pipe(
    getCategories,
    R.values,
    R.find((category) => Category.getName(category) === name)
  )

// ====== UPDATE
export const assocCategories = (newCategories) => R.assoc(categories, newCategories)
