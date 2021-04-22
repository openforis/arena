import { createChain } from './createChain'
import { fetchChain } from './fetchChain'
import { updateChain } from './updateChain'
import { deleteChain } from './deleteChain'
import { updateEntityDefUuid } from './updateEntityDefUuid'

export { ChainActionTypes } from './actionTypes'

export const ChainActions = {
  createChain,
  fetchChain,
  updateChain,
  deleteChain,
  updateEntityDefUuid,
}
