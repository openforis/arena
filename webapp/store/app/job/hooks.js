import { useSelector } from 'react-redux'

import * as JobState from './state'

export const useJob = () => {
  const hasJob = useSelector(JobState.hasJob)
  const job = useSelector(JobState.getJob)
  const closeButton = useSelector(JobState.getCloseButton)
  const closeButtonProps = useSelector(JobState.getCloseButtonProps)
  const errorKeyHeaderName = useSelector(JobState.getErrorKeyHeaderName)
  const errorsExportFileName = useSelector(JobState.getErrorsExportFileName)
  const longRunningMessageKey = useSelector(JobState.getLongRunningMessageKey)

  if (!hasJob) return {}

  return {
    job,
    closeButton,
    closeButtonProps,
    errorKeyHeaderName,
    errorsExportFileName,
    longRunningMessageKey,
  }
}
