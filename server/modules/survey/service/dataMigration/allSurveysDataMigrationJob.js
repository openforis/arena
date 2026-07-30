import { Versions } from '@openforis/arena-core'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { latestSurveyDataMigrationVersion } from './surveyDataMigrationSteps'
import SurveyDataMigrationJob from './surveyDataMigrationJob'

/**
 * Filters the given surveys, keeping only the ones whose stored app version is lower than the latest
 * survey data migration version, i.e. the ones that still need to be migrated.
 * @param {Array<{ id: number, appVersion: string }>} surveys - The surveys to filter.
 * @returns {Array<{ id: number, appVersion: string }>} - The surveys that still need to be migrated.
 */
export const getSurveysToMigrate = (surveys) =>
  surveys.filter(({ appVersion }) => Versions.isLessThan(appVersion ?? '0.0.0', latestSurveyDataMigrationVersion))

/**
 * Job that migrates every survey whose stored app version is behind the latest survey data migration
 * version. For each survey to migrate, it runs a `SurveyDataMigrationJob` in its own transaction, tolerating
 * and logging per-survey errors so that a single failing survey does not block the others. Modeled on
 * `SurveysRdbRefreshJob`.
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
        this.logDebug(`migrating data for survey ${surveyId}`)
        const innerJob = new SurveyDataMigrationJob({ surveyId, surveyAppVersion: appVersion })
        await innerJob.start() // own transaction, like SurveysRdbRefreshJob's inner job

        if (innerJob.isSucceeded()) {
          this.logDebug(`data for survey ${surveyId} migrated successfully`)
          this.incrementProcessedItems()
        } else {
          surveyIdsWithErrors.push(surveyId)
          this.logDebug(`something went wrong migrating data for survey ${surveyId}`)
        }
      } catch (error) {
        surveyIdsWithErrors.push(surveyId)
        this.logDebug(`something went wrong migrating data for survey ${surveyId}`)
      }
    }
    this.result = { surveyIdsWithErrors }
  }
}

AllSurveysDataMigrationJob.type = 'AllSurveysDataMigrationJob'
