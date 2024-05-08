import { useSelector } from 'react-redux'

import { FileUploadDialogState } from './state'

export const useFileUploadDialog = () => useSelector(FileUploadDialogState.getState)
