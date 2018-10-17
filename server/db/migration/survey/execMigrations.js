const DBMigrate = require('db-migrate')
const R = require('ramda')

const db = require('../../db')
const config = require('../migrationConfig')

const {getSurveyDBSchema} = require('../../../../common/survey/survey')

const migrateOptions = {
  config,
  cwd: `${__dirname}/`,
  env: process.env.NODE_ENV,
}

const migrateSurveySchema = async(surveyId) => {
  console.log(`starting db migrations for survey ${surveyId}`)

  const schema = getSurveyDBSchema(surveyId)

  // first create db schema
  await db.none(`CREATE SCHEMA IF NOT EXISTS ${schema}`)

  const options = R.assocPath(['config', process.env.NODE_ENV, 'schema'], schema)(migrateOptions)

  const dbm = DBMigrate.getInstance(true, options)
  await dbm.up()
}

module.exports = {
  migrateSurveySchema
}