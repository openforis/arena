import type { AreaOfInterest, AreaOfInterestDescriptor } from '@openforis/arena-core'

import { getAreaOfInterestSummary } from '@core/geo/areaOfInterestParser'
import * as ObjectUtils from '@core/objectUtils'

import { getInfo, keys as infoKeys } from './_survey/surveyInfo'
import * as SurveyFile from './surveyFile'

// the geometries are stored as survey files: the survey info only holds the descriptors
export const keys = {
  name: 'name',
  labels: 'labels',
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  size: 'size',
  polygons: 'polygons',
  vertices: 'vertices',
} as const

// same max size of the preloaded map layers
export const AREA_OF_INTEREST_MAX_FILE_SIZE_MB = 10

/**
 * Creates the descriptor of an area of interest, stored in the survey info props.
 *
 * @param {object} params - The parameters.
 * @param {string} params.name - Area name (identifier used in expressions).
 * @param {object} [params.labels] - Labels by language.
 * @param {string} params.fileUuid - UUID of the survey file with the geometry.
 * @param {string} params.fileName - Name of the uploaded file.
 * @param {number} params.size - Size of the stored file content.
 * @param {AreaOfInterest} params.areaOfInterest - The geometry (to compute the summary).
 * @returns {AreaOfInterestDescriptor} - The descriptor.
 */
export const newAreaOfInterestDescriptor = ({
  name,
  labels,
  fileUuid,
  fileName,
  size,
  areaOfInterest,
}: {
  name: string
  labels?: Record<string, string>
  fileUuid: string
  fileName: string
  size: number
  areaOfInterest: AreaOfInterest
}): AreaOfInterestDescriptor => ({
  name,
  ...(labels ? { labels } : {}),
  fileUuid,
  fileName,
  size,
  ...getAreaOfInterestSummary(areaOfInterest),
})

/**
 * Returns the areas of interest of the survey.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {AreaOfInterestDescriptor[]} - The descriptors (empty if none).
 */
export const getAreasOfInterest = (surveyOrSurveyInfo: any): AreaOfInterestDescriptor[] =>
  ObjectUtils.getProp(infoKeys.areasOfInterest, [])(getInfo(surveyOrSurveyInfo)) as AreaOfInterestDescriptor[]

/**
 * Returns the names of the areas of interest, in the survey order.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {string[]} - The names.
 */
export const getAreaOfInterestNames = (surveyOrSurveyInfo: any): string[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map((descriptor) => descriptor.name)

/**
 * Returns the UUIDs of the area of interest files.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {string[]} - The file UUIDs.
 */
export const getAreaOfInterestFileUuids = (surveyOrSurveyInfo: any): string[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map((descriptor) => descriptor.fileUuid)

/**
 * Returns the summaries ({ uuid, props: { type, name, size } }) of the area of interest files, used by survey
 * export/import and by the Arena Mobile survey package.
 *
 * @param {object} surveyOrSurveyInfo - The survey or the survey info.
 * @returns {object[]} - The file summaries.
 */
export const getAreaOfInterestFileSummaries = (
  surveyOrSurveyInfo: any
): { uuid: string; props: { type: string; name: string; size: number } }[] =>
  getAreasOfInterest(surveyOrSurveyInfo).map(({ fileUuid, fileName, size }) => ({
    uuid: fileUuid,
    props: { type: SurveyFile.SurveyFileType.areaOfInterest, name: fileName, size },
  }))
