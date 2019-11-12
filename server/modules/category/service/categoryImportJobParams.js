import * as R from 'ramda'

export const keys = {
  categoryUuid: 'categoryUuid', //if category already exists
  categoryName: 'categoryName', //if category must be created
  summary: 'summary',
}

export const getCategoryUuid = R.prop(keys.categoryUuid)
export const getCategoryName = R.prop(keys.categoryName)
export const getSummary = R.propOr({}, keys.summary)
