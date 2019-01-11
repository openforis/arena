const {expect} = require('chai')

const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')
const Validator = require('../../common/validation/validator')

const RecordProcessor = require('../../server/record/update/thread/recordProcessor')

const {getContextUser, fetchFullContextSurvey} = require('../testContext')


describe('RecordProcessor Test', async () => {
  const user = getContextUser()
  const survey = await fetchFullContextSurvey()
  const recordProcessor = new RecordProcessor()
  const record = await recordProcessor.createRecord(user, survey, Record.newRecord(user, Survey.getDefaultStep(survey)))

  const root = Record.getRootNode(record)
  Survey.getNodeDefChildByName('')

  it('Default value applied', async () => {

    await recordProcessor.persistNode(user, survey, node)

  })
})