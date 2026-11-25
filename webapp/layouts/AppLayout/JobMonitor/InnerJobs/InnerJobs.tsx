import * as JobSerialized from '@common/job/jobSerialized'
import { ExpansionPanel } from '@webapp/components'

import InnerJob from './InnerJob'

type InnerJobsProps = {
  currentJobIndex?: number
  innerJobs?: any[]
  openPanel?: boolean
  panelStartClosed?: boolean
}

const InnerJobs = ({
  currentJobIndex = 0,
  innerJobs = [],
  openPanel = undefined,
  panelStartClosed = true,
}: InnerJobsProps) => (
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

export default InnerJobs
