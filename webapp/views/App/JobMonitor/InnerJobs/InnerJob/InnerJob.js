import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobErrors from '../../JobErrors'
import JobProgress from '../../JobProgress'

const InnerJob = ({ isCurrentJob, innerJob, index }) => {
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
          {index + 1}. {i18n.t(`jobs.${JobSerialized.getType(innerJob)}`)}
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

InnerJob.defaultProps = {
  isCurrentJob: false,
}

export default InnerJob
