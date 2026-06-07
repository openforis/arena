import * as fs from 'fs'
import * as path from 'path'
import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

import * as DateUtils from '@core/dateUtils'
import * as ProcessUtils from '@core/processUtils'

import { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryS3Bucket from '@server/modules/file/repository/tempFileRepositoryS3Bucket'

const Logger = Log.getLogger('TempFilesCleanup')

const initSchedule = () =>
  // Execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // Cleanup temp files older than 6 hours
    await cleanupTempFiles(6)
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
  await cleanupFileSystemTempFiles(olderThanHours)

  if (getFileContentStorageType() === fileContentStorageTypes.s3Bucket) {
    await cleanupS3TempFiles(olderThanHours)
  }
}

export const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}
