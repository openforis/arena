import { useSelector } from 'react-redux'

import * as JobState from './state'

export const useJob = () => {
  const job = useSelector(JobState.getJob)
  const hasJob = useSelector(JobState.hasJob)
  return hasJob ? job : null
}
