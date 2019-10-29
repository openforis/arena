const R = require('ramda')
const { expect } = require('chai')

const { getContextUser } = require('../testContext')
const { uuidv4 } = require('@core/uuid')

const Survey = require('@core/survey/survey')
const Record = require('@core/record/record')
const ObjectUtils = require('@core/objectUtils')

const ActivityLog = require('@server/modules/activityLog/activityLog')
const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')
const SurveyManager = require('@server/modules/survey/manager/surveyManager')
const RecordManager = require('@server/modules/record/manager/recordManager')

const SB = require('./utils/surveyBuilder')
const RecordUtils = require('./utils/recordUtils')

describe('Activity Log Test', async () => {

  it('Activity Log on Survey Creation', async () => {
    const surveyParam = {
      name: 'test_survey_' + uuidv4(),
      label: 'Test Survey',
      languages: ['en']
    }
    const survey = await SurveyManager.createSurvey(getContextUser(), surveyParam)
    const surveyId = Survey.getId(survey)

    const surveyCreateLogs = await ActivityLogRepository.fetch(surveyId, ActivityLog.type.surveyCreate)

    expect(surveyCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })

  it('Activity Log on Record Creation', async () => {
    const user = getContextUser()

    const survey = await SB.survey(user,
      SB.entity('cluster',
        SB.attribute('cluster_no')
          .key()
      )
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    const recordToCreate = RecordUtils.newRecord(user)

    const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

    const logs = await ActivityLogRepository.fetch(surveyId, [ActivityLog.type.recordCreate])
    expect(logs.length).to.be.at.least(1)

    const recordCreateLogs = R.filter(
      activity => ObjectUtils.getUuid(ActivityLog.getContent(activity)) === Record.getUuid(record)
    )(logs)

    expect(recordCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })
})