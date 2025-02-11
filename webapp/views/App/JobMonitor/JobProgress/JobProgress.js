import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import ProgressBar from '@webapp/components/progressBar'
import { jobStatus } from '@server/job/jobUtils'

const colorByJobStatus = {
  [JobSerialized.keys.pending]: 'primary',
  [JobSerialized.keys.running]: 'primary',
  [JobSerialized.keys.failed]: 'error',
  [JobSerialized.keys.succeeded]: 'success',
}

const JobProgress = ({ isCurrentJob = true, progressPercent = undefined, status = undefined }) => {
  const color = colorByJobStatus[status]

  return (
    <ProgressBar
      color={color}
      indeterminate={isCurrentJob && status === jobStatus.pending}
      progress={progressPercent}
      className={status}
    />
  )
}

JobProgress.propTypes = {
  isCurrentJob: PropTypes.bool,
  progressPercent: PropTypes.number,
  status: PropTypes.string,
}

export default JobProgress
