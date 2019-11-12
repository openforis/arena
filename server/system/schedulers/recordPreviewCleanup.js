import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('RecordPreviewCleanup')

import * as RecordService from '@server/modules/record/service/recordService'

const initSchedule = () =>
  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      Logger.debug('Deleting stale preview records')

      const count = await RecordService.deleteRecordsPreview(true)

      Logger.debug(`${count} stale preview records deleted`)
    } catch (err) {
      Logger.error(`Error deleting stale preview records: ${err.toString()}`)
    }
  })

export const init = async () => {
  try {
    Logger.debug('Deleting stale preview records')
    const count = await RecordService.deleteRecordsPreview()
    Logger.debug(`${count} stale preview records deleted`)
  } catch (err) {
    Logger.error(`Error deleting stale preview records: ${err.toString()}`)
  }

  initSchedule()
}
