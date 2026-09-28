import * as A from '@core/arena'

import * as AppState from '../state'

export const stateKey = 'job'

const initialState = {}
const getState = A.pipe(AppState.getState, A.propOr(initialState, stateKey))

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

export const getCloseButton = A.pipe(getJob, A.propOr(null, keys.closeButton))

export const getCloseButtonProps = A.pipe(getJob, A.propOr(null, keys.closeButtonProps))

export const getOnComplete = A.pipe(getJob, A.propOr(null, keys.onComplete))

export const isAutoHide = A.pipe(getJob, A.propOr(false, keys.autoHide))

export const getErrorKeyHeaderName = A.pipe(getJob, A.prop(keys.errorKeyHeaderName))

export const getErrorsExportFileName = A.pipe(getJob, A.prop(keys.errorsExportFileName))

export const getLongRunningMessageKey = A.pipe(getJob, A.prop(keys.longRunningMessageKey))

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
