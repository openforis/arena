import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import { jobStatus } from '@server/job/jobUtils'

const Logger = Log.getLogger('StaleJobsCleanup')

const lockName = 'scheduler-stale-jobs-cleanup'
// A crashed or cycled dyno (Heroku does this on every deploy, and periodically) leaves
// its in-flight jobs' rows stuck at 'pending'/'running' forever - since
// getActiveByUserUuid/getActiveBySurveyId order by date_created and take the oldest
// active row, a stale row like that would block that user/survey cluster-wide,
// indefinitely, with no way to clear it short of manual SQL. This reaper periodically
// marks such stale rows as 'failed' so the cluster self-heals.
// 60 minutes is a generous threshold: no job type in this codebase declares an expected
// duration, so this errs toward not falsely failing a legitimately long-running import/
// export on a large survey - adjust if evidence emerges that jobs routinely run longer.
const staleAfterMinutes = 60

const cleanupStaleJobs = async () => {
  try {
    await runWithClusterLock({
      lockName,
      fn: async () => {
        Logger.debug('Marking stale job rows as failed')

        const props = {
          errors: {
            generic: {
              key: 'appErrors:generic',
              params: { text: 'Job orphaned (likely a dyno restart) and marked failed by the stale-job reaper' },
            },
          },
        }

        const result = await db.result(
          `UPDATE job
           SET status = $1,
               props = props || $2::jsonb,
               date_modified = (now() AT TIME ZONE 'UTC')
           WHERE status IN ($3, $4)
             AND date_modified < (now() AT TIME ZONE 'UTC') - ($5 || ' minutes')::interval`,
          [jobStatus.failed, JSON.stringify(props), jobStatus.pending, jobStatus.running, staleAfterMinutes]
        )

        Logger.debug(`${result.rowCount} stale job rows marked failed`)
      },
    })
  } catch (error) {
    Logger.error(`Error cleaning up stale jobs: ${error.toString()}`)
  }
}

export const init = async () => {
  await cleanupStaleJobs()

  Logger.debug('Schedule job to be executed every 15 minutes')
  schedule.scheduleJob('*/15 * * * *', cleanupStaleJobs)
}
