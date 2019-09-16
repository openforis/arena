const fs = require('fs')
const path = require('path')
const schedule = require('node-schedule')

const Logger = require('../../log/log').getLogger('TempFilesCleanup')

const DateUtils = require('../../../common/dateUtils')

const tempFolder = '/tmp/arena-upload'

const initSchedule = () =>
  // execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // cleanup temp files older than 6 hours
    await cleanupTempFiles(6)
  })

const cleanupTempFiles = async (olderThanHours = null) => {
  Logger.debug('Cleaning up temp files')

  let count = 0
  const now = new Date()

  await visitTempFiles(async (filePath, stat) => {
    //delete temp files older than 'olderThanHours'
    if (!olderThanHours || DateUtils.differenceInHours(now, new Date(stat.ctime)) >= olderThanHours) {
      await fs.unlinkSync(filePath)
      Logger.debug('Temp file deleted', filePath)
      count++
    }
  })

  Logger.debug(`${count} temp files deleted`)
}

const visitTempFiles = async visitor => {
  try {
    const files = await fs.readdirSync(tempFolder)
    for (const file of files) {
      const filePath = path.join(tempFolder, file)
      const stat = await fs.statSync(filePath)
      if (stat.isFile())
        await visitor(filePath, stat)
    }
  } catch (error) {
    //ignore errors (eg. temp folder not created yet, unable to delete temp file, etc)
  }
}

const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}

module.exports = {
  tempFolder,

  init
}