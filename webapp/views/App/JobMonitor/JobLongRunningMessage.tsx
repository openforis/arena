import { useEffect, useState } from 'react'

import * as JobSerialized from '@common/job/jobSerialized'
import { useI18n } from '@webapp/store/system'

const showMessageDelayMillis = 60 * 1000 // 1 minute

type Props = {
  job: Record<string, any>
  messageKey?: string
}

/**
 * Displays a caller-specified message once a job has been running for
 * more than 1 minute without ending. Renders nothing if no messageKey
 * is provided, before the delay has elapsed, or once the job has ended.
 */
const JobLongRunningMessage = ({ job, messageKey = undefined }: Props) => {
  const i18n = useI18n()
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (!messageKey || JobSerialized.isEnded(job)) return undefined

    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted) setShowMessage(true)
    }, showMessageDelayMillis)
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
    // Timer is started once, when the job monitor for this job is first mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!showMessage || JobSerialized.isEnded(job)) return null

  return <div className="job-long-running-message">{i18n.t(messageKey)}</div>
}

export default JobLongRunningMessage
