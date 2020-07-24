import { keys } from './keys'

export const create = ({ categoryUuid, inCategoriesPath, category }) => ({
  [keys.categoryUuid]: categoryUuid,
  [keys.inCategoriesPath]: inCategoriesPath,
  [keys.category]: category,
})
