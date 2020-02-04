import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as UserAnalysis from '@common/analysis/userAnalysis'

import { db } from '@server/db/db'

export const dropSchema = async (surveyId, client = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

export const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

export const grantSelectToUserAnalysis = async (surveyId, client = db) => {
  const schema = SchemaRdb.getName(surveyId)
  const userName = UserAnalysis.getName(surveyId)
  await client.query(`
    GRANT USAGE ON SCHEMA ${schema} TO "${userName}"
  `)
  await client.query(`
    GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO "${userName}"
  `)
}
