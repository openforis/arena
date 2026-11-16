import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const _getJson = async (zipFile: any, entryName: any, defaultValue = null) => {
  const content = await zipFile.getEntryData(entryName)
  return content ? JSON.parse(content) : defaultValue
}

const _getPartsCount = (zipFile: any, partFileNameGetter: any) => {
  let count = 0
  while (zipFile.hasEntry(partFileNameGetter(count))) {
    count = count + 1
  }
  return count
}

// Info
export const getInfo = (zipFile: any) => _getJson(zipFile, ExportFile.info)

// Survey
export const getSurvey = (zipFile: any) => _getJson(zipFile, ExportFile.survey)

// Taxonomies
export const getTaxonomies = (zipFile: any) => _getJson(zipFile, ExportFile.taxonomies, [])
export const getTaxa = (zipFile: any, taxonomyUuid: string) => _getJson(zipFile, ExportFile.taxa({ taxonomyUuid }), [])
export const getTaxaPart = ({ zipFile, taxonomyUuid, index }: { zipFile: any; taxonomyUuid: string; index: any }) =>
  _getJson(zipFile, ExportFile.taxaPart({ taxonomyUuid, index }), [])
export const getTaxaPartsCount = ({ zipFile, taxonomyUuid }: { zipFile: any; taxonomyUuid: string }) =>
  _getPartsCount(zipFile, (index) => ExportFile.taxaPart({ taxonomyUuid, index }))

// Categories
export const getCategories = (zipFile: any) => _getJson(zipFile, ExportFile.categories, {})
export const getCategoryItems = (zipFile: any, categoryUuid: string) =>
  _getJson(zipFile, ExportFile.categoryItemsSingleFile({ categoryUuid }), [])
export const getCategoryItemsPart = ({
  zipFile,
  categoryUuid,
  index = 0,
}: {
  zipFile: any
  categoryUuid: string
  index?: any
}) => _getJson(zipFile, ExportFile.categoryItemsPart({ categoryUuid, index }), [])
export const getCategoryItemsPartsCount = ({ zipFile, categoryUuid }: { zipFile: any; categoryUuid: string }) =>
  _getPartsCount(zipFile, (index) => ExportFile.categoryItemsPart({ categoryUuid, index }))

// Records
export const getRecords = (zipFile: any) => _getJson(zipFile, ExportFile.records, [])
export const hasRecords = async (zipFile: any) => (await getRecords(zipFile)).length > 0
export const getRecord = (zipFile: any, recordUuid: string) => _getJson(zipFile, ExportFile.record({ recordUuid }))

// Survey files
export const getSurveyFile = (zipFile: any, fileUuid: string) =>
  zipFile.getEntryData(ExportFile.surveyFile({ fileUuid }))
export const getChainMauFilesSummaries = (zipFile: any) => _getJson(zipFile, ExportFile.chainMauFilesSummaries, [])

// Files
export const getFilesSummaries = (zipFile: any) => _getJson(zipFile, ExportFile.filesSummaries)
export const getFile = (zipFile: any, fileUuid: string) => zipFile.getEntryData(ExportFile.file({ fileUuid }))
// Deprecated
export const getFileUuidsOld = async (zipFile: any) => {
  const entryNames = (await zipFile.getEntryNames({ path: ExportFile.filesDir })) || []
  // extract uuids from entry names
  return entryNames.map((entryName) => entryName.slice(1, -5))
}
export const getFileOld = (zipFile: any, fileUuid: string) => _getJson(zipFile, ExportFile.fileOld({ fileUuid }))

// Activities
export const getActivitiesFilesCount = (zipFile: any) =>
  _getPartsCount(zipFile, (index) => ExportFile.activityLog({ index }))
export const getActivities = (zipFile: any, index = 0) => _getJson(zipFile, ExportFile.activityLog({ index }), [])

// Users
export const getUsers = (zipFile: any) => _getJson(zipFile, ExportFile.users, [])

export const getUserProfilePicture = (zipFile: any, userUuid: string) =>
  zipFile.getEntryData(ExportFile.userProfilePicture({ userUuid }))

export const getUserInvitations = (zipFile: any) => _getJson(zipFile, ExportFile.userInvitations, [])

// Chains
export const getChains = (zipFile: any) => _getJson(zipFile, ExportFile.chains, [])
