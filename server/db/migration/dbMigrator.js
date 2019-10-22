const DBMigrate = require('db-migrate')
const path = require('path')
const R = require('ramda')

const Log = require('@server/log/log')
const logger = Log.getLogger('DBMigrator')

const db = require('../db')
const config = require('./migrationConfig')

const ProcessUtils = require('@core/processUtils')
const { getSurveyDBSchema } = require('@server/modules/survey/repository/surveySchemaRepositoryUtils')

const { fetchAllSurveyIds } = require('@server/modules/survey/repository/surveyRepository')

const env = ProcessUtils.ENV.nodeEnv

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
  logger.info(`starting db migrations for survey ${surveyId}`)

  const schema = getSurveyDBSchema(surveyId)

  await migrateSchema(schema)
}

const migrateSurveySchemas = async () => {
  const surveyIds = await fetchAllSurveyIds()

  logger.info(`starting data schemas migrations for ${surveyIds.length} surveys`)

  for (let i = 0; i < surveyIds.length; i++) {
    await migrateSurveySchema(surveyIds[i])
  }
  logger.info(`data schemas migrations completed`)
}

const migrateAll = async () => {
  try {
    logger.info('running database migrations')

    await migrateSchema()

    await migrateSurveySchemas()

    logger.info('database migrations completed')
  } catch (err) {
    logger.error(`error running database migrations: ${err.toString()}`)
  }
}

module.exports = {
  migrateAll,
  migrateSurveySchema,
}
