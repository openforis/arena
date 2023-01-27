import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { ExpansionPanel } from '@webapp/components'

import InnerJob from './InnerJob'

const InnerJobs = ({ innerJobs, openPanel, panelStartClosed }) => (
  <ExpansionPanel
    className="app-job-monitor__inner-jobs"
    buttonLabel="common.details"
    open={openPanel}
    startClosed={panelStartClosed}
  >
    {innerJobs.map((innerJob, i) => (
      <InnerJob
        key={`${JobSerialized.getUuid(innerJob)}-${JobSerialized.getType(innerJob)}`}
        innerJob={innerJob}
        index={i}
      />
    ))}
  </ExpansionPanel>
)

InnerJobs.propTypes = {
  innerJobs: PropTypes.array,
  openPanel: PropTypes.bool,
  panelStartClosed: PropTypes.bool,
}

InnerJobs.defaultProps = {
  innerJobs: [],
  openPanel: undefined,
  panelStartClosed: true,
}

export default InnerJobs
