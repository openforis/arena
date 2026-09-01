import { JobSerialized } from '@openforis/arena-core'
import * as JobSerializedUtils from '@common/job/jobSerialized'
import { useI18n } from '@webapp/store/system'

import formatDuration from './formatDuration'

type Props = {
  job: JobSerialized
}

/**
 * Displays the elapsed and estimated remaining time for a job.
 * Renders nothing when elapsed time is zero (job is still pending), or when
 * the job has already ended with a sub-second elapsed time (rounds to "0s").
 */
const JobTiming = ({ job }: Props) => {
  const i18n = useI18n()
  const elapsedMillis = JobSerializedUtils.getElapsedMillis(job)
  const elapsedFormatted = formatDuration(elapsedMillis)

  if (!elapsedFormatted) return null
  if (JobSerializedUtils.isEnded(job) && elapsedFormatted === '0s') return null

  const remainingMillis = JobSerializedUtils.getRemainingMillis(job)
  const remainingFormatted = remainingMillis === null ? null : formatDuration(remainingMillis)

  return (
    <div className="job-timing">
      {`${i18n.t('jobs:elapsed')}: ${elapsedFormatted}`}
      {remainingFormatted && ` · ${i18n.t('jobs:remaining')}: ~${remainingFormatted}`}
    </div>
  )
}

export default JobTiming
