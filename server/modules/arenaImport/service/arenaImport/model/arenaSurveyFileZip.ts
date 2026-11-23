import type FileZip from '@server/utils/file/fileZip'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const _getJson = async (zipFile: FileZip, entryName: string, defaultValue = null) => {
  const content = await zipFile.getEntryData(entryName)
  return content ? JSON.parse(content.toString()) : defaultValue
}

const _getPartsCount = (zipFile: FileZip, partFileNameGetter: (index: number) => string) => {
  let count = 0
  while (zipFile.hasEntry(partFileNameGetter(count))) {
    count = count + 1
  }
  return count
}

// Info
export const getInfo = (zipFile: FileZip) => _getJson(zipFile, ExportFile.info)

// Survey
export const getSurvey = (zipFile: FileZip) => _getJson(zipFile, ExportFile.survey)

// Taxonomies
export const getTaxonomies = (zipFile: FileZip) => _getJson(zipFile, ExportFile.taxonomies, [])
export const getTaxa = (zipFile: FileZip, taxonomyUuid: string) =>
  _getJson(zipFile, ExportFile.taxa({ taxonomyUuid }), [])
export const getTaxaPart = ({
  zipFile,
  taxonomyUuid,
  index,
}: {
  zipFile: FileZip
  taxonomyUuid: string
  index: number
}) => _getJson(zipFile, ExportFile.taxaPart({ taxonomyUuid, index }), [])
export const getTaxaPartsCount = ({ zipFile, taxonomyUuid }: { zipFile: FileZip; taxonomyUuid: string }) =>
  _getPartsCount(zipFile, (index) => ExportFile.taxaPart({ taxonomyUuid, index }))

// Categories
export const getCategories = (zipFile: FileZip) => _getJson(zipFile, ExportFile.categories, {})
export const getCategoryItems = (zipFile: FileZip, categoryUuid: string) =>
  _getJson(zipFile, ExportFile.categoryItemsSingleFile({ categoryUuid }), [])
export const getCategoryItemsPart = ({
  zipFile,
  categoryUuid,
  index = 0,
}: {
  zipFile: FileZip
  categoryUuid: string
  index?: number
}) => _getJson(zipFile, ExportFile.categoryItemsPart({ categoryUuid, index }), [])
export const getCategoryItemsPartsCount = ({ zipFile, categoryUuid }: { zipFile: FileZip; categoryUuid: string }) =>
  _getPartsCount(zipFile, (index) => ExportFile.categoryItemsPart({ categoryUuid, index }))

// Records
export const getRecords = (zipFile: FileZip) => _getJson(zipFile, ExportFile.records, [])
export const hasRecords = async (zipFile: FileZip) => (await getRecords(zipFile)).length > 0
export const getRecord = (zipFile: FileZip, recordUuid: string) => _getJson(zipFile, ExportFile.record({ recordUuid }))

// Survey files
export const getSurveyFile = (zipFile: FileZip, fileUuid: string) =>
  zipFile.getEntryData(ExportFile.surveyFile({ fileUuid }))
export const getChainMauFilesSummaries = (zipFile: FileZip) => _getJson(zipFile, ExportFile.chainMauFilesSummaries, [])

// Files
export const getFilesSummaries = (zipFile: FileZip) => _getJson(zipFile, ExportFile.filesSummaries)
export const getFile = (zipFile: FileZip, fileUuid: string) => zipFile.getEntryData(ExportFile.file({ fileUuid }))
// Deprecated
export const getFileUuidsOld = (zipFile: FileZip) => {
  const entryNames = zipFile.getEntryNames({ path: ExportFile.filesDir }) || []
  // extract uuids from entry names
  return entryNames.map((entryName) => entryName.slice(1, -5))
}
export const getFileOld = (zipFile: FileZip, fileUuid: string) => _getJson(zipFile, ExportFile.fileOld({ fileUuid }))

// Activities
export const getActivitiesFilesCount = (zipFile: FileZip) =>
  _getPartsCount(zipFile, (index) => ExportFile.activityLog({ index }))
export const getActivities = (zipFile: FileZip, index = 0) => _getJson(zipFile, ExportFile.activityLog({ index }), [])

// Users
export const getUsers = (zipFile: FileZip) => _getJson(zipFile, ExportFile.users, [])

export const getUserProfilePicture = (zipFile: FileZip, userUuid: string) =>
  zipFile.getEntryData(ExportFile.userProfilePicture({ userUuid }))

export const getUserInvitations = (zipFile: FileZip) => _getJson(zipFile, ExportFile.userInvitations, [])

// Chains
export const getChains = (zipFile: FileZip) => _getJson(zipFile, ExportFile.chains, [])
