import { createChain } from './createChain'
import { fetchChain } from './fetchChain'
import { updateChain } from './updateChain'
import { deleteChain } from './deleteChain'

export { ChainActionTypes } from './actionTypes'

export const ChainActions = {
  createChain,
  fetchChain,
  updateChain,
  deleteChain,
}
