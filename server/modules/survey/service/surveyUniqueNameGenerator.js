import { UniqueNameGenerator } from '@core/uniqueNameGenerator'
import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export const findUniqueSurveyName = async ({ startingName, client = db }) => {
  const surveyIdsAndNames = await SurveyManager.fetchSurveyIdsAndNames(client)
  const surveyNames = surveyIdsAndNames.map(({ name }) => name)
  return UniqueNameGenerator.generateUniqueName({ startingName, existingNames: surveyNames })
}
