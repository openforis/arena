const schedule = require('node-schedule')

const RecordService = require('../../modules/record/service/recordService')

const initSchedule = () =>
  schedule.scheduleJob('0 0 * * *', () => {

    const date = new Date()
    date.setHours(date.getHours() - 24)

    const stalePreviewRecords = RecordService.getStalePreviewRecordUuids(date)

    stalePreviewRecords.forEach(({ user, surveyId, recordUuid }) =>
      RecordService.checkOut(user, surveyId, recordUuid)
    )
  })

const init = async () => {
  await RecordService.deleteRecordsPreview()
  initSchedule()
}

module.exports = {
  init
}