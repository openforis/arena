import { insert, insertMany } from './insert'
import { count } from './count'
import { getMany, getAll } from './getMany'
import { getOne } from './getOne'
import { update } from './update'
import { updateIndexes } from './updateIndexes'

export const ChainNodeDefRepository = {
  insert,
  insertMany,
  count,
  getMany,
  getAll,
  getOne,
  update,
  updateIndexes,
}
