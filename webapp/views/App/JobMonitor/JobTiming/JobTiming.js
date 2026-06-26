import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'
import { useI18n } from '@webapp/store/system'

import formatDuration from './formatDuration'

/**
 * Displays the elapsed (and optionally estimated remaining) time for a job.
 * Renders nothing when elapsed time is zero (job is still pending).
 * @param {object} props - Component props.
 * @param {boolean} props.compact - When true, shows elapsed duration only with no labels (for inner jobs).
 * @param {object} props.job - Serialized job object.
 * @returns {React.ReactElement|null} Timing display, or null when there is nothing to show.
 */
const JobTiming = ({ compact = false, job = {} }) => {
  const i18n = useI18n()
  const elapsedMillis = JobSerialized.getElapsedMillis(job)
  const elapsedFormatted = formatDuration(elapsedMillis)

  if (!elapsedFormatted) return null

  if (compact) {
    return <span className="job-timing job-timing--compact">{elapsedFormatted}</span>
  }

  const remainingMillis = JobSerialized.getRemainingMillis(job)
  const remainingFormatted = remainingMillis !== null ? formatDuration(remainingMillis) : null

  return (
    <div className="job-timing">
      {`${i18n.t('jobs:elapsed')}: ${elapsedFormatted}`}
      {remainingFormatted && ` · ${i18n.t('jobs:remaining')}: ~${remainingFormatted}`}
    </div>
  )
}

JobTiming.propTypes = {
  compact: PropTypes.bool,
  job: PropTypes.object,
}

export default JobTiming
