import schedule from 'node-schedule';

import {getLogger} from '../../log/log'

import RecordService from '../../modules/record/service/recordService';

const Logger = getLogger('RecordPreviewCleanup')

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

const init = async () => {
  try {
    Logger.debug('Deleting stale preview records')
    const count = await RecordService.deleteRecordsPreview()
    Logger.debug(`${count} stale preview records deleted`)
  } catch (err) {
    Logger.error(`Error deleting stale preview records: ${err.toString()}`)
  }

  initSchedule()
}

export default {
  init
};
