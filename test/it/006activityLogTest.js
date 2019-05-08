const R = require('ramda')
const { expect } = require('chai')

const { getContextUser } = require('../testContext')
const { uuidv4 } = require('../../common/uuid')

const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')

const ActivityLogger = require('../../server/modules/activityLog/activityLogger')
const SurveyManager = require('../../server/modules/survey/manager/surveyManager')
const RecordManager = require('../../server/modules/record/manager/recordManager')

const SB = require('./utils/surveyBuilder')

describe('Activity Log Test', async () => {

  it('Activity Log on Survey Creation', async () => {
    const surveyParam = {
      name: 'test_survey_' + uuidv4(),
      label: 'Test Survey',
      lang: 'en'
    }
    const survey = await SurveyManager.createSurvey(getContextUser(), surveyParam)
    const surveyId = Survey.getId(survey)

    const logs = await ActivityLogger.fetchLogs(surveyId)

    expect(logs.length).to.be.at.least(1)

    const surveyCreateLogs = R.filter(
      R.propEq(ActivityLogger.keys.type, ActivityLogger.type.surveyCreate)
    )(logs)

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

    const recordToCreate = Record.newRecord(user)

    const record = await RecordManager.createRecord(user, surveyId, recordToCreate)

    const logs = await ActivityLogger.fetchLogs(Survey.getId(survey))
    expect(logs.length).to.be.at.least(1)

    const recordCreateLogs = R.filter(log =>
      R.propEq(ActivityLogger.keys.type, ActivityLogger.type.recordCreate, log) &&
      R.pathEq([ActivityLogger.keys.params, Record.keys.uuid], Record.getUuid(record), log)
    )(logs)

    expect(recordCreateLogs).to.have.lengthOf(1)

    await SurveyManager.deleteSurvey(surveyId)
  })
})