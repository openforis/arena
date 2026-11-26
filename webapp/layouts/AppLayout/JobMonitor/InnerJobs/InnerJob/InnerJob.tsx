import { useEffect, useRef } from 'react'

import type { ArenaJobSerialized } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'
import { AppIcon, IconName } from '@webapp/components/AppIcon'
import { useI18n } from '@webapp/store/system'
import JobErrors from '../../JobErrors'
import JobProgress from '../../JobProgress'
import JobTiming from '../../JobTiming'

const getStatusIcon = (innerJob, isCurrentJob): IconName => {
  if (JobSerialized.isSucceeded(innerJob)) return 'checkboxChecked'
  if (JobSerialized.isFailed(innerJob)) return 'close'
  if (isCurrentJob) return 'spinner'
  return 'checkboxUnchecked'
}

type InnerJobProps = {
  isCurrentJob?: boolean
  innerJob: ArenaJobSerialized
  index: number
}

const InnerJob = ({ isCurrentJob = false, innerJob, index }: InnerJobProps) => {
  const i18n = useI18n()
  const elementRef = useRef(null)

  const isRunning = JobSerialized.isRunning(innerJob)
  const statusIcon = getStatusIcon(innerJob, isCurrentJob)

  useEffect(() => {
    if (isRunning && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isRunning])

  return (
    <>
      <div className="job" ref={elementRef}>
        <div className="name">
          <AppIcon className="status-icon" name={statusIcon} />
          {index + 1}. {i18n.t(`jobs:${JobSerialized.getType(innerJob)}`)}
        </div>
        {(isCurrentJob || JobSerialized.isEnded(innerJob)) && (
          <JobProgress isCurrentJob={isCurrentJob} job={innerJob} />
        )}
        <JobTiming job={innerJob} />
      </div>
      <JobErrors job={innerJob} />
    </>
  )
}

export default InnerJob
