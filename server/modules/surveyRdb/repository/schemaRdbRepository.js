import { Schemata } from '@common/model/db'

import { db } from '@server/db/db'

export const dropSchema = async (surveyId, client = db) =>
  client.query(`DROP SCHEMA IF EXISTS ${Schemata.getSchemaSurveyRdb(surveyId)} CASCADE`)

export const createSchema = async (surveyId, client = db) =>
  client.query(`CREATE SCHEMA ${Schemata.getSchemaSurveyRdb(surveyId)}`)

export const selectSchemaExists = async (surveyId, client = db) => {
  const result = await client.one(
    `
     SELECT COUNT(*) = 1 AS res
     FROM information_schema.schemata
     WHERE schema_name = $1
    `,
    [Schemata.getSchemaSurveyRdb(surveyId)]
  )
  return result.res
}
