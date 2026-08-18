import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

/**
 * Ordered list of per-survey data migration steps.
 * Each step is applied to a survey when its stored app version is lower than the step's version threshold.
 * @type {Array<{ version: string, migrate: (params: { surveyId: number }) => Promise<void> }>}
 */
export const surveyDataMigrationSteps = [
  {
    version: '2.3.20', // formerly versionWithCategoryItemIndexFix in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await CategoryManager.initializeCategoryItemIndexesForSurvey({ surveyId })
    },
  },
  {
    version: '2.5.6', // formerly versionWithNewFilePathFormat in server/system/dataMigrator/index.js
    migrate: async ({ surveyId }) => {
      await SurveyFileManager.migrateFilesToNewPathFormat({ surveyId })
    },
  },
  // future per-survey migration steps are appended here, each with its own version threshold
]

/**
 * The highest version among the registered survey data migration steps.
 * Computed via `Versions` comparison (not string/insertion-order comparison), so it is correct even if steps
 * were ever registered out of order; falls back to '0.0.0' if the steps list is ever empty.
 * @type {string}
 */
export const latestSurveyDataMigrationVersion =
  surveyDataMigrationSteps.reduce(
    (latest, step) => (latest === null || Versions.isGreaterThan(step.version, latest) ? step.version : latest),
    null
  ) ?? '0.0.0'

/**
 * Returns a guaranteed-valid application version string to stamp a survey with, meaning "fully migrated as of
 * right now". This is the single place that decides that value: it falls back to
 * `latestSurveyDataMigrationVersion` whenever `ProcessUtils.ENV.applicationVersion` is falsy (e.g. `APP_VERSION`
 * not set, as happens with `yarn dev:server` or some container startups) or is not a parseable version string,
 * so that a survey never gets stamped with a value that would later blow up `isSurveyDataMigrationPending`.
 * @returns {string} - A valid version string, safe to store in the survey's `app_version` column.
 */
export const getCurrentAppVersionStamp = () => {
  const { applicationVersion } = ProcessUtils.ENV
  if (!applicationVersion) return latestSurveyDataMigrationVersion
  try {
    Versions.parse(applicationVersion)
    return applicationVersion
  } catch {
    return latestSurveyDataMigrationVersion
  }
}

/**
 * Determines whether a survey's per-survey data migration is still pending, given the app version
 * it was last migrated to.
 * @param {object} params - The parameters object.
 * @param {string} [params.appVersion] - The app version the survey was last migrated to (null/undefined is treated as '0.0.0').
 * @returns {boolean} - True if the survey's stored app version is older than the latest survey data migration
 *   version, or if the stored app version is not a parseable version string (fail safe: treat as still pending,
 *   so the migration job will retry it, rather than throwing on every fetch).
 */
export const isSurveyDataMigrationPending = ({ appVersion }) => {
  try {
    return Versions.isLessThan(appVersion ?? '0.0.0', latestSurveyDataMigrationVersion)
  } catch {
    return true
  }
}
