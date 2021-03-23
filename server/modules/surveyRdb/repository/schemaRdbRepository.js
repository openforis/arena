import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { db } from '@server/db/db'

export const dropSchema = async (surveyId, client = db) =>
  client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

export const createSchema = async (surveyId, client = db) =>
  client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

export const getTables = async (surveyId, client = db) =>
  client.query(`SELECT * FROM pg_catalog.pg_tables where schemaname = '${SchemaRdb.getName(surveyId)}'`)
