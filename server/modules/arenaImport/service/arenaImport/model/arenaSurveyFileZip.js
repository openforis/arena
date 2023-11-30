import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const _getJson = async (zipFile, entryName, defaultValue = null) => {
  const content = await zipFile.getEntryData(entryName)
  return content ? JSON.parse(content) : defaultValue
}

// Survey
export const getSurvey = async (zipFile) => _getJson(zipFile, ExportFile.survey)

// Taxonomies
export const getTaxonomies = async (zipFile) => _getJson(zipFile, ExportFile.taxonomies, [])
export const getTaxa = async (zipFile, taxonomyUuid) => _getJson(zipFile, ExportFile.taxa({ taxonomyUuid }), [])

// Categories
export const getCategories = async (zipFile) => _getJson(zipFile, ExportFile.categories, {})
export const getCategoryItems = async (zipFile, categoryUuid) =>
  _getJson(zipFile, ExportFile.categoryItems({ categoryUuid }), [])

// Records
export const getRecords = async (zipFile) => _getJson(zipFile, ExportFile.records, [])
export const hasRecords = async (zipFile) => (await getRecords(zipFile)).length > 0
export const getRecord = async (zipFile, recordUuid) => _getJson(zipFile, ExportFile.record({ recordUuid }))

// Files
export const getFilesSummaries = async (zipFile) => _getJson(zipFile, ExportFile.filesSummaries)
export const getFile = async (zipFile, fileUuid) => zipFile.getEntryData(ExportFile.file({ fileUuid }))
// Deprecated
export const getFileUuidsOld = async (zipFile) => {
  const entryNames = (await zipFile.getEntryNames({ path: ExportFile.filesDir })) || []
  // extract uuids from entry names
  return entryNames.map((entryName) => entryName.slice(1, entryName.length - 5))
}
export const getFileOld = async (zipFile, fileUuid) => _getJson(zipFile, ExportFile.fileOld({ fileUuid }))

// Activities
export const getActivitiesFilesCount = (zipFile) => {
  let count = 0
  while (zipFile.hasEntry(ExportFile.activityLog({ index: count }))) {
    count = count + 1
  }
  return count
}
export const getActivities = async (zipFile, index = 0) => _getJson(zipFile, ExportFile.activityLog({ index }), [])

// Users
export const getUsers = async (zipFile) => _getJson(zipFile, ExportFile.users, [])

export const getUserProfilePicture = async (zipFile, userUuid) =>
  zipFile.getEntryData(ExportFile.userProfilePicture({ userUuid }))

export const getUserInvitations = async (zipFile) => _getJson(zipFile, ExportFile.userInvitations, [])

// Chains
export const getChains = async (zipFile) => _getJson(zipFile, ExportFile.chains, [])
