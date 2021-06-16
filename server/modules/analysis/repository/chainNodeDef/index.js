import { insert, insertMany } from './insert'

import { getAll } from './getMany'
import { getOne } from './getOne'
import { update, updateScript } from './update'
import { updateIndexes } from './updateIndexes'

export const ChainNodeDefRepository = {
  insert,
  insertMany,
  getAll,
  getOne,
  update,
  updateScript,
  updateIndexes,
}
