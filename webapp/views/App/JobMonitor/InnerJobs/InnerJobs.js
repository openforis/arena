import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { ExpansionPanel } from '@webapp/components'

import InnerJob from './InnerJob'

const InnerJobs = ({ currentJobIndex, innerJobs, openPanel, panelStartClosed }) => (
  <ExpansionPanel
    className="app-job-monitor__inner-jobs"
    buttonLabel="common.details"
    open={openPanel}
    startClosed={panelStartClosed}
  >
    {innerJobs.map((innerJob, index) => (
      <InnerJob
        key={`${JobSerialized.getUuid(innerJob)}-${JobSerialized.getType(innerJob)}`}
        isCurrentJob={currentJobIndex === index}
        innerJob={innerJob}
        index={index}
      />
    ))}
  </ExpansionPanel>
)

InnerJobs.propTypes = {
  currentJobIndex: PropTypes.number,
  innerJobs: PropTypes.array,
  openPanel: PropTypes.bool,
  panelStartClosed: PropTypes.bool,
}

InnerJobs.defaultProps = {
  currentJobIndex: 0,
  innerJobs: [],
  openPanel: undefined,
  panelStartClosed: true,
}

export default InnerJobs
