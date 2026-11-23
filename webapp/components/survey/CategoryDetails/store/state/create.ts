import { keys } from './keys'

export const create = ({ category, onCategoryUpdate }) => ({
  [keys.category]: category,
  [keys.onCategoryUpdate]: onCategoryUpdate,
})
