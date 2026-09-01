import { UniqueNameGenerator } from '@core/uniqueNameGenerator'
import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export const findUniqueSurveyName = async ({
  startingName,
  client = db,
}: {
  startingName: string
  client?: any
}): Promise<string> => {
  const surveyIdsAndNames = await SurveyManager.fetchSurveyIdsAndNames(client)
  const surveyNames = new Set(surveyIdsAndNames.map(({ name }) => name))
  return UniqueNameGenerator.generateUniqueName({ startingName, existingNames: surveyNames })
}
