import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as Survey from '@core/survey/survey'
import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

const expectSchemaToExist = async (schemaName, exists = true) => {
  const result = await db.one(
    `
     SELECT COUNT(*) = 1 as res 
     FROM information_schema.schemata 
     WHERE schema_name = $1
    `,
    [schemaName]
  )
  // schema ${schemaName} ${exists ? 'exists' : 'not exists'}
  expect(result.res).toBe(exists)
}

describe('Survey RDB Sync Test', () => {
  test('Survey RDB created on survey creation', async () => {
    const survey = await SB.survey(
      getContextUser(),
      SB.entity('cluster', SB.attribute('cluster_no').key())
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    await expectSchemaToExist(SchemaRdb.getName(surveyId))

    await SurveyManager.deleteSurvey(surveyId)
  })

  test('Survey RDB dropped on survey deletion', async () => {
    const survey = await SB.survey(
      getContextUser(),
      SB.entity('cluster', SB.attribute('cluster_no').key())
    ).buildAndStore()

    const surveyId = Survey.getId(survey)

    const dataSchemaName = SchemaRdb.getName(surveyId)

    await SurveyManager.deleteSurvey(surveyId)

    await expectSchemaToExist(dataSchemaName, false)
  })
})
