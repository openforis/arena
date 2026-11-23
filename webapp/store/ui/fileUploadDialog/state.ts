import * as A from '@core/arena'
import * as UiState from '../state'

const stateKey = 'fileUploadDialog'

const keys = {
  accept: 'accept',
  maxSize: 'maxSize',
  onOk: 'onOk',
  open: 'open',
  title: 'title',
}

const create = ({ accept, maxSize, onOk, title }) => {
  return {
    [keys.open]: true,
    [keys.accept]: accept,
    [keys.maxSize]: maxSize,
    [keys.onOk]: onOk,
    [keys.title]: title,
  }
}

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

// context is the FileUploadDialoState
const isOpen = A.prop(keys.open)
const getOnOk = A.prop(keys.onOk)

const reset = () => ({})

export const FileUploadDialogState = {
  stateKey,
  create,
  getState,
  isOpen,
  getOnOk,
  reset,
}
