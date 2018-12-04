const db = require('../db/db')

const getSchemaName = surveyId => `survey_${surveyId}_data`
const getNodeDefTableName = nodeDef => `_${nodeDef.id}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)}`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

const createNodeDefTable = async (surveyId, nodeDef) => {
  console.log('=== ndoeDef ', nodeDef)

  await db.query(`
    CREATE TABLE
      ${getSchemaName(surveyId)}.${getNodeDefTableName(nodeDef)}
    (
      id          bigserial NOT NULL,
      uuid        uuid      NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

      PRIMARY KEY (id)
    )
  `)
}

module.exports = {
  dropSchema,
  createSchema,
  createNodeDefTable,
}