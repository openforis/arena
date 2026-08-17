import { Versions } from '@openforis/arena-core'
import { DBMigrator } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { getCurrentAppVersionStamp, surveyDataMigrationSteps } from './surveyDataMigrationSteps'

/**
 * Determines the data migration steps that still need to be applied to a survey, given the app version
 * it was last migrated to.
 * @param {object} params - The parameters object.
 * @param {string} [params.surveyAppVersion] - The app version the survey was last migrated to (null/undefined is treated as '0.0.0').
 * @returns {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>} - The pending migration steps, in order.
 */
export const getPendingSurveyDataMigrationSteps = ({ surveyAppVersion }) =>
  surveyDataMigrationSteps.filter((step) => Versions.isLessThan(surveyAppVersion ?? '0.0.0', step.version))

/**
 * Job that migrates a single survey's schema, then applies every pending data migration step to it, then
 * stamps the survey with the current application version. It is always run inside its own transaction (via
 * `start()`) and it is meant to be instantiated and started directly by `AllSurveysDataMigrationJob`, never
 * registered/created from a serialized job type.
 */
export default class SurveyDataMigrationJob extends Job {
  constructor(params) {
    super(SurveyDataMigrationJob.type, params)
  }

  async execute() {
    const { surveyId, surveyAppVersion } = this.context

    // Bring the survey's DDL schema up to date first; idempotent (db-migrate tracks applied migrations per
    // schema), so this is safe even though arena-server's own startup migration also still covers it today.
    await DBMigrator.migrateSurveySchema(surveyId)

    const stepsToRun = getPendingSurveyDataMigrationSteps({ surveyAppVersion })
    this.total = stepsToRun.length

    for (const step of stepsToRun) {
      await step.migrate({ surveyId })
      this.incrementProcessedItems()
    }

    await SurveyManager.updateSurveyAppVersion({ surveyId, version: getCurrentAppVersionStamp() }, this.tx)
  }
}

SurveyDataMigrationJob.type = 'SurveyDataMigrationJob'
