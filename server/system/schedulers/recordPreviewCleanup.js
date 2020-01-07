import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('RecordPreviewCleanup')

import * as RecordService from '@server/modules/record/service/recordService'

const deleteRecordsPreview = async (olderThan24Hours = false) => {
  try {
    Logger.debug('Deleting stale preview records')

    const count = await RecordService.deleteRecordsPreview(olderThan24Hours)

    Logger.debug(`${count} stale preview records deleted`)
  } catch (error) {
    Logger.error(`Error deleting stale preview records: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteRecordsPreview()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => await deleteRecordsPreview(true))
}
