import type { AreaOfInterest, AreaOfInterestProvider } from '@openforis/arena-core'
import { Surveys } from '@openforis/arena-core'

import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as Survey from '@core/survey/survey'

import * as Log from '@server/log/log'

import * as SurveyFileManager from './surveyFileManager'

const Logger = Log.getLogger('AreaOfInterestProvider')

// survey files are never modified (a new upload gets a new uuid): cached geometries never become stale
const maxCachedAreas = 50
const cache = new Map<string, AreaOfInterest>()

const cacheGet = (key: string): AreaOfInterest | undefined => {
  const value = cache.get(key)
  if (value) {
    // most recently used last (Map keeps the insertion order)
    cache.delete(key)
    cache.set(key, value)
  }
  return value
}

const cachePut = (key: string, value: AreaOfInterest): void => {
  cache.set(key, value)
  if (cache.size > maxCachedAreas) {
    cache.delete(cache.keys().next().value!)
  }
}

const fetchAreaOfInterest = async ({
  surveyId,
  fileUuid,
}: {
  surveyId: number
  fileUuid: string
}): Promise<AreaOfInterest | undefined> => {
  const fileSummary = await SurveyFileManager.fetchFileSummaryByUuid(surveyId, fileUuid)
  const content = fileSummary ? await SurveyFileManager.fetchFileContentAsBuffer({ surveyId, fileSummary }) : null
  const areaOfInterest = content ? parseAreaOfInterestJson(content.toString('utf8')) : null
  if (!areaOfInterest) {
    Logger.warn(`Survey ${surveyId}: area of interest file ${fileUuid} missing or not valid`)
  }
  return areaOfInterest ?? undefined
}

/**
 * Returns the geometry of the specified area of interest, reading it from its survey file.
 *
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.name - The area of interest name.
 * @returns {Promise<AreaOfInterest|undefined>} - The geometry, or undefined if not defined or not readable.
 */
const getAreaOfInterest: AreaOfInterestProvider['getAreaOfInterest'] = async ({ survey, name }) => {
  const descriptor = Surveys.getAreaOfInterestByName({ survey, name })
  if (!descriptor) return undefined
  const surveyId = Survey.getId(survey)
  const { fileUuid } = descriptor
  const key = `${surveyId}_${fileUuid}`
  const cached = cacheGet(key)
  if (cached) return cached
  const areaOfInterest = await fetchAreaOfInterest({ surveyId, fileUuid })
  if (areaOfInterest) cachePut(key, areaOfInterest)
  return areaOfInterest
}

export const AreaOfInterestProviderDefault: AreaOfInterestProvider = { getAreaOfInterest }
