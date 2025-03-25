import * as fs from 'fs'
import * as path from 'path'
import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

import * as DateUtils from '@core/dateUtils'
import * as ProcessUtils from '@core/processUtils'

const Logger = Log.getLogger('TempFilesCleanup')

const initSchedule = () =>
  // Execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // Cleanup temp files older than 6 hours
    await cleanupTempFiles(6)
  })

const cleanupTempFiles = async (olderThanHours = null) => {
  const tempFolder = ProcessUtils.ENV.tempFolder

  Logger.debug(`Cleaning up temp files in folder ${tempFolder}`)

  let count = 0
  try {
    if (await fs.existsSync(tempFolder)) {
      const now = new Date()
      const files = await fs.readdirSync(tempFolder)
      for (const file of files) {
        const filePath = path.join(tempFolder, file)
        const stat = await fs.statSync(filePath)
        if (stat.isFile() && (!olderThanHours || DateUtils.diffInHours(now, new Date(stat.ctime)) >= olderThanHours)) {
          await fs.unlinkSync(filePath)
          Logger.debug('Temp file deleted', filePath)
          count++
        }
      }
    }
  } catch (error) {
    // ignore errors
    Logger.error('Error deleting temp files', error)
  }

  Logger.debug(`${count} temp files deleted`)
}

export const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}
