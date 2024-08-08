import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const toggleEditLock = (dispatch, getState) => {
  const state = getState()
  const lockedPrev = RecordState.isRecordEditLocked(state)
  const lockedNext = !lockedPrev
  dispatch({ type: ActionTypes.recordEditLock, locked: lockedNext })
}
