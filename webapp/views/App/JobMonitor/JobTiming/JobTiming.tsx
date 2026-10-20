import { useEffect, useState } from 'react'
import { JobSerialized } from '@openforis/arena-core'
import * as JobSerializedUtils from '@common/job/jobSerialized'
import { useI18n } from '@webapp/store/system'

import formatDuration from './formatDuration'

type Props = {
  job: JobSerialized
}

/**
 * Displays the elapsed and estimated remaining time for a job.
 * Elapsed time ticks locally every second (anchored to the last server-reported
 * value) instead of only advancing when a job status update is received, so it
 * doesn't appear to freeze between updates.
 * Renders nothing when elapsed time is zero (job is still pending), or when
 * the job has already ended with a sub-second elapsed time (rounds to "0s").
 */
const JobTiming = ({ job }: Props) => {
  const i18n = useI18n()
  const jobEnded = JobSerializedUtils.isEnded(job)
  const jobRunning = JobSerializedUtils.isRunning(job)
  const serverElapsedMillis = JobSerializedUtils.getElapsedMillis(job)

  // Re-sync the ticked value to the authoritative server value whenever a fresh one arrives.
  const [prevServerElapsedMillis, setPrevServerElapsedMillis] = useState<number>(serverElapsedMillis)
  const [tickedElapsedMillis, setTickedElapsedMillis] = useState<number>(serverElapsedMillis)
  if (serverElapsedMillis !== prevServerElapsedMillis) {
    setPrevServerElapsedMillis(serverElapsedMillis)
    setTickedElapsedMillis(serverElapsedMillis)
  }

  useEffect(() => {
    if (!jobRunning) return
    // Track the real delta between ticks (rather than assuming a fixed 1000ms step),
    // so a throttled/background tab doesn't cause the elapsed time to undercount.
    let lastTick = Date.now()
    const intervalId = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTick
      lastTick = now
      setTickedElapsedMillis((elapsed) => elapsed + delta)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [jobRunning])

  const elapsedFormatted = formatDuration(jobEnded ? serverElapsedMillis : tickedElapsedMillis)

  if (!elapsedFormatted) return null
  if (jobEnded && elapsedFormatted === '0s') return null

  const remainingMillis = JobSerializedUtils.getRemainingMillis(job)
  const remainingFormatted = remainingMillis === null ? null : formatDuration(remainingMillis)

  return (
    <div className="job-timing">
      {`${i18n.t('common.elapsed')}: ${elapsedFormatted}`}
      {remainingFormatted && ` · ${i18n.t('common.remaining')}: ~${remainingFormatted}`}
    </div>
  )
}

export default JobTiming
