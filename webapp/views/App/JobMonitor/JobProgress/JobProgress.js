import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import ProgressBar from '@webapp/components/progressBar'

const colorByJobStatus = {
  [JobSerialized.keys.pending]: 'primary',
  [JobSerialized.keys.running]: 'primary',
  [JobSerialized.keys.failed]: 'error',
  [JobSerialized.keys.succeeded]: 'success',
}

const JobProgress = ({ isCurrentJob, job }) => {
  const color = colorByJobStatus[JobSerialized.getStatus(job)]

  return (
    <ProgressBar
      color={color}
      indeterminate={isCurrentJob && JobSerialized.isPending(job)}
      progress={JobSerialized.getProgressPercent(job)}
      className={JobSerialized.getStatus(job)}
    />
  )
}

JobProgress.propTypes = {
  isCurrentJob: PropTypes.bool,
  job: PropTypes.object,
}

JobProgress.defaultProps = {
  isCurrentJob: false,
  job: {},
}

export default JobProgress
