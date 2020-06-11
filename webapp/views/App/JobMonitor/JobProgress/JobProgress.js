import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import ProgressBar from '@webapp/components/progressBar'

const JobProgress = ({ job }) => (
  <ProgressBar progress={JobSerialized.getProgressPercent(job)} className={JobSerialized.getStatus(job)} />
)

JobProgress.propTypes = {
  job: PropTypes.object,
}

JobProgress.defaultProps = {
  job: {},
}

export default JobProgress
