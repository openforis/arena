const DBMigrate = require('db-migrate')
const R = require('ramda')

const db = require('../../db')
const config = require('../migrationConfig')

const surveyDataSchemaPrefix = 'of_arena_survey_'

const migrateOptions = {
  config,
  cwd: `${__dirname}/`,
  env: process.env.NODE_ENV,
}

const migrateSurveyDataSchema = async(surveyId) => {
  console.log(`starting db migrations for survey ${surveyId}`)

  const schema = surveyDataSchemaPrefix + surveyId

  await createSchemaIfNotExists(schema)

  const options = R.assocPath(['config', process.env.NODE_ENV, 'schema'], schema)(migrateOptions)

  const dbm = DBMigrate.getInstance(true, options)
  await dbm.up()

  console.log(`db migrations for survey ${surveyId} completed`)
}

const createSchemaIfNotExists = async (schema) => {
  await db.tx(async t => {
    await t.none(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
  })
}

module.exports = {
  migrateSurveyDataSchema
}