import { Versions } from '@openforis/arena-core'

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
 * Job that applies every pending data migration step to a single survey, then stamps the survey with the
 * current application version. It is always run inside its own transaction (via `start()`) and it is meant
 * to be instantiated and started directly by `AllSurveysDataMigrationJob`, never registered/created from a
 * serialized job type.
 */
export default class SurveyDataMigrationJob extends Job {
  constructor(params) {
    super(SurveyDataMigrationJob.type, params)
  }

  async execute() {
    const { surveyId, surveyAppVersion } = this.context

    const stepsToRun = getPendingSurveyDataMigrationSteps({ surveyAppVersion })
    this.total = stepsToRun.length

    for (const step of stepsToRun) {
      await step.migrate({ surveyId, client: this.tx })
      this.incrementProcessedItems()
    }

    await SurveyManager.updateSurveyAppVersion({ surveyId, version: getCurrentAppVersionStamp() }, this.tx)
  }
}

SurveyDataMigrationJob.type = 'SurveyDataMigrationJob'
