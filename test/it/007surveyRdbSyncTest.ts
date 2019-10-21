const { expect } = require('chai')

const db = require('../../server/db/db')

const { getContextUser } = require('../testContext')

const Survey = require('../../core/survey/survey')
const SchemaRdb = require('../../common/surveyRdb/schemaRdb')

const SurveyManager = require('../../server/modules/survey/manager/surveyManager')

const SB = require('./utils/surveyBuilder')

const expectSchemaToExist = async (schemaName, exists = true) => {
  const result = await db.one(`
     SELECT COUNT(*) = 1 as res 
     FROM information_schema.schemata 
     WHERE schema_name = $1
    `,
    [schemaName]
  )
  expect(result['res'], `schema ${schemaName} ${exists ? 'exists' : 'not exists'}`).to.equal(exists)
}

describe('Survey RDB Sync Test', async () => {

  it('Survey RDB created on survey creation', async () => {

    const survey = await SB.survey(getContextUser(),
      SB.entity('cluster',
        SB.attribute('cluster_no')
          .key()
      )
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    await expectSchemaToExist(SchemaRdb.getName(surveyId))

    await SurveyManager.deleteSurvey(surveyId)
  })

  it('Survey RDB dropped on survey deletion', async () => {

    const survey = await SB.survey(getContextUser(),
      SB.entity('cluster',
        SB.attribute('cluster_no')
          .key()
      )
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    const dataSchemaName = SchemaRdb.getName(surveyId)

    await SurveyManager.deleteSurvey(surveyId)

    await expectSchemaToExist(dataSchemaName, false)
  })

})
