import { useSelector } from 'react-redux'

import * as DialogConfirmState from './state'

export const useDialogConfirm = () => {
  const key = useSelector(DialogConfirmState.getKey)
  const params = useSelector(DialogConfirmState.getParams)
  const okButtonLabel = useSelector(DialogConfirmState.getOkButtonLabel)
  const okButtonClass = useSelector(DialogConfirmState.getOkButtonClass)
  const okButtonIconClass = useSelector(DialogConfirmState.getOkButtonIconClass)
  const headerText = useSelector(DialogConfirmState.getHeaderText)
  const strongConfirm = useSelector(DialogConfirmState.isStrongConfirm)
  const strongConfirmInputLabel = useSelector(DialogConfirmState.getStrongConfirmInputLabel)
  const strongConfirmRequiredText = useSelector(DialogConfirmState.getStrongConfirmRequiredText)
  const strongConfirmText = useSelector(DialogConfirmState.getStrongConfirmText)

  return {
    key,
    params,
    okButtonLabel,
    okButtonClass,
    okButtonIconClass,
    headerText,
    strongConfirm,
    strongConfirmInputLabel,
    strongConfirmRequiredText,
    strongConfirmText,
  }
}
