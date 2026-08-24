import * as fs from 'fs'
import * as path from 'path'
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as DateUtils from '@core/dateUtils'
import * as ProcessUtils from '@core/processUtils'

import { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryS3Bucket from '@server/modules/file/repository/tempFileRepositoryS3Bucket'

const Logger = Log.getLogger('TempFilesCleanup')

const lockName = 'scheduler-temp-files-cleanup'

const initSchedule = () =>
  // Execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // Cleanup temp files older than 6 hours
    await cleanupTempFilesWithLock(6)
  })

const cleanupFileSystemTempFiles = async (olderThanHours = 4) => {
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
        if (stat.isFile() && DateUtils.diffInHours(now, new Date(stat.ctime)) >= olderThanHours) {
          await fs.unlinkSync(filePath)
          Logger.debug('Temp file deleted', filePath)
          count++
        }
      }
    }
  } catch (error) {
    // ignore errors
    Logger.error('Error deleting temp files from file system', error)
  }

  Logger.debug(`${count} temp files deleted from file system`)
}

const cleanupS3TempFiles = async (olderThanHours = 4) => {
  Logger.debug('Cleaning up temp files in S3 bucket')
  try {
    const count = await TempFileRepositoryS3Bucket.deleteOldTempFiles({ olderThanHours })
    Logger.debug(`${count} temp files deleted from S3 bucket`)
  } catch (error) {
    Logger.error('Error deleting temp files from S3 bucket', error)
  }
}

const cleanupTempFiles = async (olderThanHours = 4) => {
  // Local-filesystem temp files are per-dyno by nature (each dyno only has its own disk), so this
  // part is safe to run on every dyno unconditionally - only the shared S3 cleanup below needs the lock.
  await cleanupFileSystemTempFiles(olderThanHours)

  if (getFileContentStorageType() === fileContentStorageTypes.s3Bucket) {
    try {
      await runWithClusterLock({ lockName, fn: () => cleanupS3TempFiles(olderThanHours) })
    } catch (error) {
      Logger.error('Error acquiring cluster lock for S3 temp files cleanup', error)
    }
  }
}

const cleanupTempFilesWithLock = cleanupTempFiles

export const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}
