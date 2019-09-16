const schedule = require('node-schedule')

const SurveyManager = require('../../modules/survey/manager/surveyManager')
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

const cleanUpRecordsPreview = async () => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  await Promise.all(
    surveyIds.map(async surveyId =>
      await RecordService.deleteRecordsPreview(surveyId)
    )
  )
}

const init = async () => {
  await cleanUpRecordsPreview()
  initSchedule()
}

module.exports = {
  init
}