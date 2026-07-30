import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

/**
 * Ordered list of per-survey data migration steps.
 * Each step is applied to a survey when its stored app version is lower than the step's version threshold.
 * @type {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>}
 */
export const surveyDataMigrationSteps = [
  {
    version: '2.5.6', // formerly versionWithNewFilePathFormat in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await SurveyFileManager.migrateFilesToNewPathFormat({ surveyId })
    },
  },
  // future per-survey migration steps are appended here, each with its own version threshold
]

/**
 * The version of the last (most recent) migration step in the survey data migration steps list.
 * @type {string}
 */
export const latestSurveyDataMigrationVersion = surveyDataMigrationSteps.at(-1).version
