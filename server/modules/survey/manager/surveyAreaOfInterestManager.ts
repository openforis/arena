import type { AreaOfInterest } from '@openforis/arena-core'

import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as Survey from '@core/survey/survey'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import * as SurveyFileManager from './surveyFileManager'

const Logger = Log.getLogger('SurveyAreaOfInterestManager')

/**
 * Reads the area of interest geometry from the survey file referenced by the survey info.
 *
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} [client] - The database client.
 * @returns {Promise<AreaOfInterest|null>} - The area of interest, or null if not defined or not readable.
 */
export const fetchAreaOfInterest = async (
  { survey }: { survey: any },
  client: any = db
): Promise<AreaOfInterest | null> => {
  const fileUuid = SurveyAreaOfInterest.getAreaOfInterestFileUuid(survey)
  if (!fileUuid) return null
  const surveyId = Survey.getId(survey)
  const fileSummary = await SurveyFileManager.fetchFileSummaryByUuid(surveyId, fileUuid, client)
  const content = fileSummary
    ? await SurveyFileManager.fetchFileContentAsBuffer({ surveyId, fileSummary }, client)
    : null
  const areaOfInterest = content ? parseAreaOfInterestJson(content.toString('utf8')) : null
  if (!areaOfInterest) {
    Logger.warn(`Survey ${surveyId}: area of interest file ${fileUuid} missing or not valid`)
  }
  return areaOfInterest
}

/**
 * Sets the area of interest geometry (read from its survey file) in the survey, in memory only: it is needed by the
 * expression evaluator (geoDistanceToAOIBoundary function).
 *
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} [client] - The database client.
 * @returns {Promise<object>} - The survey with the area of interest, or the same survey if it has no area of interest.
 */
export const assocAreaOfInterestFromFile = async ({ survey }: { survey: any }, client: any = db): Promise<any> => {
  const areaOfInterest = await fetchAreaOfInterest({ survey }, client)
  return areaOfInterest ? SurveyAreaOfInterest.assocAreaOfInterest(areaOfInterest)(survey) : survey
}
