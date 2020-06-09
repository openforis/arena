import * as R from 'ramda'

export const stateKey = 'job'

const initialState = {}
const getState = R.propOr(initialState, stateKey)

export const keys = {
  onComplete: 'onComplete',
  autoHide: 'autoHide',
}

// ====== READ
export const getJob = getState

export const getOnComplete = R.pipe(getJob, R.propOr(null, keys.onComplete))

export const hasJob = (state) => Object.keys(getJob(state)).length > 0

// ====== UPDATE
export const startJob = ({ job, onComplete = null, autoHide = false }) => () => ({
  ...job,
  [keys.onComplete]: onComplete,
  [keys.autoHide]: autoHide,
})

export const updateJob = ({ job }) => (state) => (job ? { ...state, ...job } : initialState)
