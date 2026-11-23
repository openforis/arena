import { FileUploadDialogState } from './state'

export const FILE_UPLOAD_DIALOG_OPEN = 'ui/fileUploadDialog/open'
export const FILE_UPLOAD_DIALOG_CLOSE = 'ui/fileUploadDialog/close'

const open =
  ({
    accept = {},
    maxSize = 1000, // maximum file size in MBs
    onOk,
    title,
  }) =>
  (dispatch) =>
    dispatch({
      type: FILE_UPLOAD_DIALOG_OPEN,
      accept,
      maxSize,
      onOk,
      title,
    })

const close = () => (dispatch) => dispatch({ type: FILE_UPLOAD_DIALOG_CLOSE })

const onOk = () => (dispatch, getState) => {
  const onOk = FileUploadDialogState.getOnOk(getState())
  dispatch(onOk)
  dispatch(close())
}

export const FileUploadDialogActions = {
  FILE_UPLOAD_DIALOG_OPEN,
  FILE_UPLOAD_DIALOG_CLOSE,
  open,
  close,
  onOk,
}
