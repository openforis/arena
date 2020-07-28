import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobProgress from '../JobProgress'
import JobErrors from '../JobErrors'

const InnerJobs = ({ innerJobs }) => {
  const i18n = useI18n()

  return (
    innerJobs.length > 0 && (
      <div className="app-job-monitor__inner-jobs">
        {innerJobs.map((innerJob, i) => (
          <React.Fragment key={`${String(i)}-${JobSerialized.getType(innerJob)}`}>
            <div className="job">
              <div className="name">
                {i + 1}. {i18n.t(`jobs.${JobSerialized.getType(innerJob)}`)}
              </div>
              <JobProgress job={innerJob} />
            </div>
            <JobErrors job={innerJob} />
          </React.Fragment>
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
