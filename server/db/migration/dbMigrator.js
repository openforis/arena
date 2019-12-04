import * as path from 'path'
import * as DBMigrate from 'db-migrate'
import * as R from 'ramda'

import * as Log from '@server/log/log'
const logger = Log.getLogger('DBMigrator')

import * as ProcessUtils from '@core/processUtils'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import { fetchAllSurveyIds } from '@server/modules/survey/repository/surveyRepository'
import { db } from '../db'
import * as config from './migrationConfig'

const env = ProcessUtils.ENV.nodeEnv

const publicSchema = 'public'

const migrationFolders = {
  public: 'public',
  survey: 'survey',
}

const migrateSchema = async (schema = publicSchema) => {
  const migrationsFolder = schema === publicSchema ? migrationFolders.public : migrationFolders.survey

  const migrateOptions = {
    config: R.clone(config),
    cwd: `${path.join(__dirname, migrationsFolder)}`,
    env,

    // Required to work around an EventEmitter leak bug.
    // See: https://github.com/db-migrate/node-db-migrate/issues/421
    throwUncatched: true,
  }

  migrateOptions.config[env].schema = schema

  if (schema !== publicSchema) {
    // First create db schema
    await db.none(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
  }

  const dbm = DBMigrate.getInstance(true, migrateOptions)

  await dbm.up()
}

export const migrateSurveySchema = async surveyId => {
  logger.info(`starting db migrations for survey ${surveyId}`)

  const schema = getSurveyDBSchema(surveyId)

  await migrateSchema(schema)
}

export const migrateSurveySchemas = async () => {
  const surveyIds = await fetchAllSurveyIds()

  logger.info(`starting data schemas migrations for ${surveyIds.length} surveys`)

  for (const element of surveyIds) {
    await migrateSurveySchema(element)
  }

  logger.info('data schemas migrations completed')
}

export const migrateAll = async () => {
  try {
    logger.info('running database migrations')

    await migrateSchema()

    await migrateSurveySchemas()

    logger.info('database migrations completed')
  } catch (error) {
    logger.error(`error running database migrations: ${error.toString()}`)
    throw error
  }
}
