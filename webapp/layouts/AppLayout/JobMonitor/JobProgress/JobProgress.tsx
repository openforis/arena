import * as JobSerialized from '@common/job/jobSerialized'
import ProgressBar from '@webapp/components/ProgressBar'

const colorByJobStatus: Record<string, 'primary' | 'error' | 'success'> = {
  [JobSerialized.keys.pending]: 'primary',
  [JobSerialized.keys.running]: 'primary',
  [JobSerialized.keys.failed]: 'error',
  [JobSerialized.keys.succeeded]: 'success',
}

type JobProgressProps = {
  isCurrentJob?: boolean
  job?: Record<string, any>
}

const JobProgress = ({ isCurrentJob = true, job = {} }: JobProgressProps) => {
  const color = colorByJobStatus[JobSerialized.getStatus(job)]
  const progressPercent = JobSerialized.getProgressPercent(job)

  return (
    <ProgressBar
      color={color}
      indeterminate={isCurrentJob && JobSerialized.isPending(job)}
      progress={progressPercent}
      className={JobSerialized.getStatus(job)}
    />
  )
}

export default JobProgress
