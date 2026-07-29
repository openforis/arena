import { ChainState } from '../state'
import { ChainActionTypes } from './actionTypes'

export const toggleEditLock = (dispatch, getState) => {
  const state = getState()
  const lockedPrev = ChainState.isChainEditLocked(state)
  dispatch({ type: ChainActionTypes.chainEditLock, locked: !lockedPrev })
}

export const setEditLocked = (locked) => ({ type: ChainActionTypes.chainEditLock, locked })
