const schedule = require('node-schedule')
const Promise = require('bluebird')

const SurveyManager = require('../survey/surveyManager')
const RecordManager = require('../record/recordManager')

const initSchedule = () =>
  schedule.scheduleJob('0 0 * * *', () => {

    const date = new Date()
    date.setHours(date.getHours() - 24)

    const stalePreviewRecords = RecordManager.getStalePreviewRecordUuids(date)

    stalePreviewRecords.forEach(({ user, surveyId, recordUuid }) =>
      RecordManager.checkOutRecord(user, surveyId, recordUuid)
    )
  })

const cleanUpRecordsPreview = async () => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  await Promise.all(
    surveyIds.map(async surveyId =>
      await RecordManager.deleteRecordsPreview(surveyId)
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