import { keys } from './keys'

export const create = ({ category }) => ({
  [keys.category]: category,
})
