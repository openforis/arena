import { Schemata } from '@common/model/db'
import TableOlapData from '@common/model/db/tables/olapData/table'

import { db } from '@server/db/db'

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
  const items = await client.query(
    `SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = $1 
      AND (${prefixes.map((prefix) => `table_name LIKE '${prefix}%'`).join(' OR ')})`,
    [schema]
  )
  for await (const { table_name: name, table_type: type } of items) {
    await client.query(`DROP ${type === 'BASE TABLE' ? 'TABLE' : 'VIEW'} IF EXISTS ${schema}.${name} CASCADE`)
  }
}

export const dropDataTablesAndViews = async (surveyId, client = db) =>
  dropDataTablesAndViewsWithPrefixes({ surveyId, prefixes: [dataTablePrefix, nodeViewPrefix] }, client)

export const dropOlapDataTablesAndViews = async (surveyId, client = db) =>
  dropDataTablesAndViewsWithPrefixes({ surveyId, prefixes: [olapDataTablePrefix] }, client)
