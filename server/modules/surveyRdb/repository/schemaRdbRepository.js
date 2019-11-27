import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import {db} from '../../../db/db'

export const dropSchema = async (surveyId, client = db) =>
  await client.query(
    `DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`,
  )

export const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)
