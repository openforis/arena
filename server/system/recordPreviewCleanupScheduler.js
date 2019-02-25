const schedule = require('node-schedule')

const RecordManager = require('../record/recordManager')
const RecordUsersMap = require('../record/update/recordUsersMap')

const init = () => {
  schedule.scheduleJob('0 0 * * *', () => {
    // 24 hours ago
    const date = new Date()
    date.setHours(date.getHours() - 24)

    const stalePreviewRecords = RecordUsersMap.getStalePreviewRecordUuids(date)

    stalePreviewRecords.forEach(({ user, surveyId, recordUuid }) =>
      RecordManager.checkOutRecord(user, surveyId, recordUuid))
  })
}

module.exports = {
  init
}