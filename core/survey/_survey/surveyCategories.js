import * as R from 'ramda'

import * as Category from '../category'

const categories = 'categories'

// ====== READ
export const getCategories = R.pipe(
  R.prop(categories),
  R.defaultTo({})
)

export const getCategoriesArray = R.pipe(
  getCategories,
  R.values,
  // Sort by name
  R.sort((category1, category2) => {
    const name1 = Category.getName(category1)
    const name2 = Category.getName(category2)

    return name1 < name2
      ? -1
      : (name1 > name2
        ? 1
        : 0)
  })
)

export const getCategoryByUuid = uuid => R.pipe(
  getCategories,
  R.prop(uuid)
)

// ====== UPDATE
export const assocCategories = newCategories => R.assoc(categories, newCategories)
