import type { SurveyDataMigrationService } from '@openforis/arena-server'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

/**
 * Survey data migration status used by arena-server (e.g. the login with includeSurvey keeps the current survey
 * pref while the survey data migration is pending).
 */
export const SurveyDataMigrationServiceArena: SurveyDataMigrationService = {
  isPending: async ({ surveyId }) => SurveyManager.isSurveyDataMigrationPendingById(surveyId),
}
