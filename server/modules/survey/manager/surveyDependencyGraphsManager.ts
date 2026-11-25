import * as Survey from '@core/survey/survey'
import { db, type DbClient } from '@server/db/db'

import * as SurveyManager from './surveyManager'

/**
 * Builds again the dependency graph of the published survey and stores it in the survey metadata
 * (e.g. when arena-core adds new dependency types).
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {object} [client] - The database client.
 * @returns {Promise<void>} - The result promise.
 */
export const rebuildDependencyGraphs = async (
  { surveyId }: { surveyId: number },
  client: DbClient = db
): Promise<void> => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, advanced: true, skipMigrationCheck: true },
    client
  )
  if (Survey.getNodeDefsArray(survey).length === 0) return

  const graph = await Survey.buildDependencyGraph(survey)
  await SurveyManager.updateSurveyDependencyGraphs(surveyId, graph, client)
}
