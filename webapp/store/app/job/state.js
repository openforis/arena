import * as R from 'ramda'

import * as AppState from '../state'

export const stateKey = 'job'

const initialState = {}
const getState = R.pipe(AppState.getState, R.propOr(initialState, stateKey))

export const keys = {
  closeButton: 'closeButton',
  autoHide: 'autoHide',
  onComplete: 'onComplete',
}

// ====== READ
export const getJob = getState

export const getCloseButton = R.pipe(getJob, R.propOr(null, keys.closeButton))

export const getOnComplete = R.pipe(getJob, R.propOr(null, keys.onComplete))

export const hasJob = (state) => Object.keys(getJob(state)).length > 0

// ====== UPDATE
export const startJob = ({ job, onComplete = null, closeButton = null, autoHide = false }) => ({
  ...job,
  [keys.autoHide]: autoHide,
  [keys.closeButton]: closeButton,
  [keys.onComplete]: onComplete,
})

export const updateJob = ({ job }) => (state) => (job ? { ...state, ...job } : initialState)
