import { DBMigrator } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { isSurveyDataMigrationPending } from './surveyDataMigrationSteps'
import SurveyDataMigrationJob from './surveyDataMigrationJob'

/**
 * Filters the given surveys, keeping only the ones whose stored app version is lower than the latest
 * survey data migration version, i.e. the ones that still need to be migrated.
 * @param {Array<{ id: number, appVersion: string }>} surveys - The surveys to filter.
 * @returns {Array<{ id: number, appVersion: string }>} - The surveys that still need to be migrated.
 */
export const getSurveysToMigrate = (surveys) =>
  surveys.filter(({ appVersion }) => isSurveyDataMigrationPending({ appVersion }))

/**
 * Job that migrates every survey whose stored app version is behind the latest survey data migration
 * version. For each survey to migrate, it first brings the survey's DDL schema up to date
 * (`DBMigrator.migrateSurveySchema`, idempotent), then runs a `SurveyDataMigrationJob` in its own transaction
 * to apply the data-migration steps and stamp the survey's app version — strictly in that order, so a crash
 * partway through leaves already-completed surveys correctly stamped (and not re-run) while the rest are
 * safely retried on the next startup. Tolerates and logs per-survey errors so that a single failing survey
 * does not block the others. Modeled on `SurveysRdbRefreshJob`.
 */
export default class AllSurveysDataMigrationJob extends Job {
  constructor(params) {
    super(AllSurveysDataMigrationJob.type, params)
  }

  async execute() {
    const surveys = await SurveyManager.fetchSurveyIdsAndAppVersions()
    const surveysToMigrate = getSurveysToMigrate(surveys)
    this.total = surveysToMigrate.length

    const surveyIdsWithErrors = []
    for (const { id: surveyId, appVersion } of surveysToMigrate) {
      if (this.isCanceled()) return
      try {
        const stillExists = (await SurveyManager.fetchAllSurveyIds()).includes(surveyId)
        if (!stillExists) {
          this.logWarn(`skipping survey ${surveyId}: it no longer exists (deleted concurrently)`)
          continue
        }

        this.logDebug(`migrating schema for survey ${surveyId}`)
        await DBMigrator.migrateSurveySchema(surveyId)

        this.logDebug(`migrating data for survey ${surveyId}`)
        const innerJob = new SurveyDataMigrationJob({ surveyId, surveyAppVersion: appVersion })
        await innerJob.start() // own transaction, like SurveysRdbRefreshJob's inner job

        if (innerJob.isSucceeded()) {
          this.logDebug(`data for survey ${surveyId} migrated successfully`)
          this.incrementProcessedItems()
        } else {
          surveyIdsWithErrors.push(surveyId)
          this.logWarn(`could not migrate data for survey ${surveyId}: inner job did not succeed`)
        }
      } catch (error) {
        surveyIdsWithErrors.push(surveyId)
        this.logError(`error migrating survey ${surveyId}: ${error.stack || error}`)
      }
    }
    this.result = { surveyIdsWithErrors }
  }
}

AllSurveysDataMigrationJob.type = 'AllSurveysDataMigrationJob'
