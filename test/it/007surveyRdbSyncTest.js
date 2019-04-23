const R = require('ramda')
const { expect } = require('chai')

const { getContextUser } = require('../testContext')
const { uuidv4 } = require('../../common/uuid')

const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')

const SurveyManager = require('../../server/modules/survey/persistence/surveyManager')
const RecordUpdateManager = require('../../server/modules/record/persistence/recordUpdateManager')
const SurveyRdbService = require('../../server/modules/surveyRdb/service/surveyRdbService')

const SB = require('./utils/surveyBuilder')
const RB = require('./utils/recordBuilder')

describe('Survey RDB Sync Test', async () => {

  it('Survey RDB created on survey creation', async () => {
    const surveyParam = {
      name: 'test_survey_' + uuidv4(),
      label: 'Test Survey',
      lang: 'en'
    }
    const survey = await SurveyManager.createSurvey(getContextUser(), surveyParam)

    //TODO

    await SurveyManager.deleteSurvey(Survey.getId(survey))
  })

})
