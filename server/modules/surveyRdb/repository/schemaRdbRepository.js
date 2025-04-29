import { Schemata } from '@common/model/db'
import TableOlapData from '@common/model/db/tables/olapData/table'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

const dataTablePrefix = 'data_'
const nodeViewPrefix = '_node_'
const olapDataTablePrefix = TableOlapData.tableNamePrefix

export const dropSchema = async (surveyId, client = db) =>
  client.query(`DROP SCHEMA IF EXISTS ${Schemata.getSchemaSurveyRdb(surveyId)} CASCADE`)

export const createSchema = async (surveyId, client = db) =>
  client.query(`CREATE SCHEMA IF NOT EXISTS ${Schemata.getSchemaSurveyRdb(surveyId)}`)

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

const dropDataTablesAndViewsWithPrefixes = async ({ surveyId, prefixes }, client = db) => {
  const schema = Schemata.getSchemaSurveyRdb(surveyId)
  const items = await DbUtils.selectTablesAndViewsStartingWithPrefixes({ schema, prefixes }, client)
  for await (const { table_name: name, table_type: tableType } of items) {
    const type = tableType === 'BASE TABLE' ? 'TABLE' : 'VIEW'
    await client.query(`DROP ${type} IF EXISTS ${schema}.${name} CASCADE`)
  }
}

export const selectOlapDataTablesExists = async (surveyId, client = db) => {
  const schema = Schemata.getSchemaSurveyRdb(surveyId)
  const items = await DbUtils.selectTablesAndViewsStartingWithPrefixes(
    { schema, prefixes: [olapDataTablePrefix] },
    client
  )
  return items.length > 0
}

export const dropDataTablesAndViews = async (surveyId, client = db) =>
  dropDataTablesAndViewsWithPrefixes({ surveyId, prefixes: [dataTablePrefix, nodeViewPrefix] }, client)

export const dropOlapDataTablesAndViews = async (surveyId, client = db) =>
  dropDataTablesAndViewsWithPrefixes({ surveyId, prefixes: [olapDataTablePrefix] }, client)
