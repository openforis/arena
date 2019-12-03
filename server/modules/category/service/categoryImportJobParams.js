import * as R from 'ramda'

export const keys = {
  categoryUuid: 'categoryUuid', // If category already exists
  categoryName: 'categoryName', // If category must be created
  summary: 'summary',
}

export const getCategoryUuid = R.prop(keys.categoryUuid)
export const getCategoryName = R.prop(keys.categoryName)
export const getSummary = R.propOr({}, keys.summary)
