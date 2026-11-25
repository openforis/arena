import { cloneChainFromSurvey } from './cloneChainFromSurvey'
import { createChain } from './createChain'
import { createNodeDef } from './createNodeDef'
import { deleteChain } from './deleteChain'
import { setEditLocked, toggleEditLock } from './editLock'
import { fetchChain } from './fetchChain'
import { fetchRecordsCountByStep } from './fetchRecordsCountByStep'
import { openRStudio } from './openRStudio'
import { resetChainStore } from './resetChainStore'
import { updateChain } from './updateChain'

export { ChainActionTypes } from './actionTypes'

export const ChainActions = {
  createChain,
  fetchChain,
  updateChain,
  deleteChain,
  cloneChainFromSurvey,
  resetChainStore,
  createNodeDef,
  openRStudio,
  fetchRecordsCountByStep,
  toggleEditLock,
  setEditLocked,
}
