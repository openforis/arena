import { insert, insertMany } from './insert'
import { fetchChainNodeDef, fetchChainNodeDefsByChainUuid } from './read'

import { count } from './count'
import { getMany, getAll } from './getMany'
import { getOne } from './getOne'
import { update } from './update'
import { updateIndexes } from './updateIndexes'

export const ChainNodeDefRepository = {
  insert,
  insertMany,
  fetchChainNodeDef,
  fetchChainNodeDefsByChainUuid,
  count,
  getMany,
  getAll,
  getOne,
  update,
  updateIndexes,
}
