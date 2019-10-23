const db = require('../../../db/db')

const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

const dropSchema = async (surveyId, client = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

module.exports = {
  dropSchema,
  createSchema,
}