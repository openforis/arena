import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobProgress from '../../JobProgress'
import JobErrors from '../../JobErrors'

const InnerJob = ({ isCurrentJob = false, innerJob, index }) => {
  const i18n = useI18n()
  const elementRef = useRef(null)

  useEffect(() => {
    if (JobSerialized.isRunning(innerJob) && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [JobSerialized.getStatus(innerJob)])

  return (
    <>
      <div className="job" ref={elementRef}>
        <div className="name">
          {index + 1}. {i18n.t(`jobs:${JobSerialized.getType(innerJob)}`)}
        </div>
        {(isCurrentJob || JobSerialized.isEnded(innerJob)) && (
          <JobProgress isCurrentJob={isCurrentJob} job={innerJob} />
        )}
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
