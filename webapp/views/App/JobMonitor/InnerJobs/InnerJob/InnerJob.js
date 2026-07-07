import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobProgress from '../../JobProgress'
import JobErrors from '../../JobErrors'
import JobTiming from '../../JobTiming'

const getStatusIconClass = (innerJob, isCurrentJob) => {
  if (JobSerialized.isSucceeded(innerJob)) return 'icon-checkbox-checked'
  if (JobSerialized.isFailed(innerJob)) return 'icon-cross'
  if (isCurrentJob) return 'icon-spinner'
  return 'icon-checkbox-unchecked'
}

const InnerJob = ({ isCurrentJob = false, innerJob, index }) => {
  const i18n = useI18n()
  const elementRef = useRef(null)

  const isRunning = JobSerialized.isRunning(innerJob)
  const statusIconClass = getStatusIconClass(innerJob, isCurrentJob)

  useEffect(() => {
    if (isRunning && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isRunning])

  return (
    <>
      <div className="job" ref={elementRef}>
        <div className="name">
          <span className={`icon status-icon ${statusIconClass}`} />
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

InnerJob.propTypes = {
  isCurrentJob: PropTypes.bool,
  innerJob: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

export default InnerJob
