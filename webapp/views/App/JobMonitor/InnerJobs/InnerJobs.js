import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import InnerJob from './InnerJob'

const InnerJobs = ({ innerJobs }) => {
  return (
    innerJobs.length > 0 && (
      <div className="app-job-monitor__inner-jobs">
        {innerJobs.map((innerJob, i) => (
          <InnerJob key={`${String(i)}-${JobSerialized.getType(innerJob)}`} innerJob={innerJob} index={i} />
        ))}
      </div>
    )
  )
}

InnerJobs.propTypes = {
  innerJobs: PropTypes.array,
}

InnerJobs.defaultProps = {
  innerJobs: [],
}

export default InnerJobs
