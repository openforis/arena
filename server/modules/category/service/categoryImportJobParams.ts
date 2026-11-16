import * as A from '@core/arena'

export const keys = {
  categoryUuid: 'categoryUuid', // If category already exists
  categoryName: 'categoryName', // If category must be created
  summary: 'summary',
}

export const getCategoryUuid = A.prop(keys.categoryUuid)
export const getCategoryName = A.prop(keys.categoryName)
export const getSummary = A.propOr({}, keys.summary)
