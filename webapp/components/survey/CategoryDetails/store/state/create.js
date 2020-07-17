import { keys } from './keys'

export const create = ({ categoryUuid, inCategoriesPath }) => ({
  [keys.categoryUuid]: categoryUuid,
  [keys.inCategoriesPath]: inCategoriesPath,
})
