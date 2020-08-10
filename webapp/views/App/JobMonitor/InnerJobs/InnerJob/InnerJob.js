import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobProgress from '../../JobProgress'
import JobErrors from '../../JobErrors'

const InnerJob = ({ innerJob, i }) => {
  const i18n = useI18n()
  const elementRef = useRef(null)

  useEffect(() => {
    if (JobSerialized.getStatus(innerJob) === 'running' && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [JobSerialized.getStatus(innerJob)])

  return (
    <>
      <div className="job" ref={elementRef}>
        <div className="name">
          {i + 1}. {i18n.t(`jobs.${JobSerialized.getType(innerJob)}`)}
        </div>
        <JobProgress job={innerJob} />
      </div>
      <JobErrors job={innerJob} />
    </>
  )
}

InnerJob.propTypes = {
  innerJob: PropTypes.object.isRequired,
  i: PropTypes.number.isRequired,
}

export default InnerJob
