const DBMigrate = require('db-migrate')
const path = require('path')
const R = require('ramda')

const db = require('../db')
const config = require('./migrationConfig')

const { getProcessNodeEnv } = require('../../../common/processUtils')
const { getSurveyDBSchema } = require('../../modules/survey/repository/surveySchemaRepositoryUtils')

const { fetchAllSurveyIds } = require('../../modules/survey/repository/surveyRepository')

const env = getProcessNodeEnv()

const publicSchema = 'public'

const migrationFolders = {
  public: 'public',
  survey: 'survey'
}

const migrateSchema = async (schema = publicSchema) => {

  const migrationsFolder = schema === publicSchema
    ? migrationFolders.public
    : migrationFolders.survey

  const migrateOptions = {
    config: R.clone(config),
    cwd: `${path.join(__dirname, migrationsFolder)}`,
    env
  }

  migrateOptions.config[env].schema = schema

  if (schema !== publicSchema) {
    // first create db schema
    await db.none(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
  }

  const dbm = DBMigrate.getInstance(true, migrateOptions)

  await dbm.up()
}

const migrateSurveySchema = async (surveyId) => {
  console.log(`starting db migrations for survey ${surveyId}`)

  const schema = getSurveyDBSchema(surveyId)

  await migrateSchema(schema)
}

const migrateSurveySchemas = async () => {
  const surveyIds = await fetchAllSurveyIds()

  console.log(`starting data schemas migrations for ${surveyIds.length} surveys`)

  for (let i = 0; i < surveyIds.length; i++) {
    await migrateSurveySchema(surveyIds[i])
  }
  console.log(`data schemas migrations completed`)
}

const migrateAll = async () => {
  try {
    console.log('running database migrations')

    await migrateSchema()

    await migrateSurveySchemas()

    console.log('database migrations completed')
  } catch (err) {
    console.log('error running database migrations', err)
  }
}

module.exports = {
  migrateAll,
  migrateSurveySchema,
}
