import { useSelector } from 'react-redux'

import * as DialogConfirmState from './state'

export const useDialogConfirm = () => {
  const key = useSelector(DialogConfirmState.getKey)
  const params = useSelector(DialogConfirmState.getParams)

  return { key, params }
}
