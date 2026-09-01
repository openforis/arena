import * as R from 'ramda'

import * as AppState from '../state'

export const stateKey = 'job'

const initialState = {}
const getState = R.pipe(AppState.getState, R.propOr(initialState, stateKey))

export const keys = {
  closeButton: 'closeButton',
  closeButtonProps: 'closeButtonProps',
  autoHide: 'autoHide',
  onComplete: 'onComplete',
  errorKeyHeaderName: 'errorKeyHeaderName',
  errorsExportFileName: 'errorsExportFileName',
  longRunningMessageKey: 'longRunningMessageKey',
}

// ====== READ
export const getJob = getState

export const getCloseButton = R.pipe(getJob, R.propOr(null, keys.closeButton))

export const getCloseButtonProps = R.pipe(getJob, R.propOr(null, keys.closeButtonProps))

export const getOnComplete = R.pipe(getJob, R.propOr(null, keys.onComplete))

export const isAutoHide = R.pipe(getJob, R.propOr(false, keys.autoHide))

export const getErrorKeyHeaderName = R.pipe(getJob, R.prop(keys.errorKeyHeaderName))

export const getErrorsExportFileName = R.pipe(getJob, R.prop(keys.errorsExportFileName))

export const getLongRunningMessageKey = R.pipe(getJob, R.prop(keys.longRunningMessageKey))

export const hasJob = (state) => Object.keys(getJob(state)).length > 0

// ====== UPDATE
export const startJob = ({
  job,
  onComplete = null,
  closeButton = null,
  closeButtonProps = null,
  autoHide = false,
  errorKeyHeaderName = undefined,
  errorsExportFileName = null,
  longRunningMessageKey = undefined,
}) => ({
  ...job,
  [keys.autoHide]: autoHide,
  [keys.closeButton]: closeButton,
  [keys.closeButtonProps]: closeButtonProps,
  [keys.onComplete]: onComplete,
  [keys.errorKeyHeaderName]: errorKeyHeaderName,
  [keys.errorsExportFileName]: errorsExportFileName,
  [keys.longRunningMessageKey]: longRunningMessageKey,
})

export const updateJob =
  ({ job }) =>
  (state) =>
    job ? { ...state, ...job } : initialState
