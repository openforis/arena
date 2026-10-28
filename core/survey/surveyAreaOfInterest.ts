import * as A from '@core/arena'

import type { AreaOfInterest } from '@openforis/arena-core'

import { getAreaOfInterestSummary } from '@core/geo/areaOfInterestParser'
import * as ObjectUtils from '@core/objectUtils'

import { getInfo, keys as infoKeys } from './_survey/surveyInfo'
import * as SurveyFile from './surveyFile'

// the area of interest geometry is stored as survey file: the survey info props only reference it
export const keys = {
  fileUuid: 'fileUuid',
  name: 'name',
  size: 'size',
  polygons: 'polygons',
  vertices: 'vertices',
} as const

export type AreaOfInterestFileDescriptor = {
  [keys.fileUuid]: string
  [keys.name]: string
  [keys.size]: number
  [keys.polygons]: number
  [keys.vertices]: number
}

// same max size of the preloaded map layers
export const AREA_OF_INTEREST_MAX_FILE_SIZE_MB = 10

/**
 * Creates the descriptor of an area of interest file, stored in the survey info props.
 *
 * @param {object} params - The parameters.
 * @param {string} params.fileUuid - UUID of the survey file.
 * @param {string} params.name - Name of the uploaded file.
 * @param {number} params.size - Size of the stored file content.
 * @param {AreaOfInterest} params.areaOfInterest - The area of interest (to compute the summary).
 * @returns {AreaOfInterestFileDescriptor} - The descriptor.
 */
export const newAreaOfInterestFileDescriptor = ({
  fileUuid,
  name,
  size,
  areaOfInterest,
}: {
  fileUuid: string
  name: string
  size: number
  areaOfInterest: AreaOfInterest
}): AreaOfInterestFileDescriptor => ({
  [keys.fileUuid]: fileUuid,
  [keys.name]: name,
  [keys.size]: size,
  ...getAreaOfInterestSummary(areaOfInterest),
})

/**
 * Returns the descriptor of the area of interest file of the survey, if any.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {AreaOfInterestFileDescriptor|null} - The descriptor or null.
 */
export const getAreaOfInterestFile = (surveyOrSurveyInfo: any): AreaOfInterestFileDescriptor | null =>
  ObjectUtils.getProp(
    infoKeys.areaOfInterestFile,
    null
  )(getInfo(surveyOrSurveyInfo)) as AreaOfInterestFileDescriptor | null

/**
 * Returns the UUID of the area of interest file of the survey, if any.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {string|null} - The file UUID or null.
 */
export const getAreaOfInterestFileUuid = (surveyOrSurveyInfo: any): string | null =>
  getAreaOfInterestFile(surveyOrSurveyInfo)?.[keys.fileUuid] ?? null

/**
 * Returns the summary ({ uuid, props: { type, name, size } }) of the area of interest file, used by survey
 * export/import and by the Arena Mobile survey package.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {object|null} - The file summary or null.
 */
export const getAreaOfInterestFileSummary = (
  surveyOrSurveyInfo: any
): { uuid: string; props: { type: string; name: string; size: number } } | null => {
  const descriptor = getAreaOfInterestFile(surveyOrSurveyInfo)
  const fileUuid = descriptor?.[keys.fileUuid]
  if (!fileUuid) return null
  return {
    uuid: fileUuid,
    props: { type: SurveyFile.SurveyFileType.areaOfInterest, name: descriptor[keys.name], size: descriptor[keys.size] },
  }
}

/**
 * Sets the area of interest geometry in the survey info props, only in memory: it is read from there by the
 * arena-core expression evaluator (geoDistanceToAOIBoundary function).
 *
 * @param {AreaOfInterest|null} areaOfInterest - The area of interest geometry.
 * @returns {function(object): object} - Function returning the updated survey.
 */
export const assocAreaOfInterest =
  (areaOfInterest: AreaOfInterest | null) =>
  (survey: any): any =>
    survey.info
      ? A.assocPath([infoKeys.info, infoKeys.props, infoKeys.areaOfInterest], areaOfInterest)(survey)
      : ObjectUtils.setProp(infoKeys.areaOfInterest, areaOfInterest)(survey)
