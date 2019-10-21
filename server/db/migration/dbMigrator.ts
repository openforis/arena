import DBMigrate from 'db-migrate';
import path from 'path';
import * as R from 'ramda';
import Log from '../../log/log';
const logger = Log.getLogger('DBMigrator')

import db from '../db';
import config from './migrationConfig';
import ProcessUtils from '../../../core/processUtils';
import { getSurveyDBSchema } from '../../modules/survey/repository/surveySchemaRepositoryUtils';
import { fetchAllSurveyIds } from '../../modules/survey/repository/surveyRepository';

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

export const migrateSurveySchema = async (surveyId) => {
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

export const migrateAll = async () => {
  try {
    logger.info('running database migrations')

    await migrateSchema()

    await migrateSurveySchemas()

    logger.info('database migrations completed')
  } catch (err) {
    logger.error(`error running database migrations: ${err.toString()}`)
  }
}

export default {
  migrateAll,
  migrateSurveySchema,
};
