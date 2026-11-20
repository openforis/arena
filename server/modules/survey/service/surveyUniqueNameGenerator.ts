import { UniqueNameGenerator } from '@core/uniqueNameGenerator'
import { db, type DbClient } from '@server/db/db'
import { nameMaxLength } from '@server/modules/collectImport/service/collectImport/model/nodeDefUniqueNameGenerator'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export const findUniqueSurveyName = async ({
  startingName,
  client = db,
}: {
  startingName: string
  client?: DbClient
}): Promise<string> => {
  const surveyIdsAndNames = await SurveyManager.fetchSurveyIdsAndNames(client)
  const surveyNames = new Set(surveyIdsAndNames.map(({ name }) => name))
  return UniqueNameGenerator.generateUniqueName({ startingName, existingNames: surveyNames, maxLength: nameMaxLength })
}
