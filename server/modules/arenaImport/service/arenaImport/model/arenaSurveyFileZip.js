import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'

const _getJson = async (zipFile, entryName) => {
  const content = await zipFile.getEntryData(entryName)
  return content ? JSON.parse(content) : null
}

// Survey
export const getSurvey = async (zipFile) => _getJson(zipFile, ExportFile.survey)

// Taxonomies
export const getTaxonomies = async (zipFile) => _getJson(zipFile, ExportFile.taxonomies)
export const getTaxa = async (zipFile, taxonomyUuid) => _getJson(zipFile, ExportFile.taxa({ taxonomyUuid }))

// Categories
export const getCategories = async (zipFile) => _getJson(zipFile, ExportFile.categories)
export const getCategoryItems = async (zipFile, categoryUuid) =>
  _getJson(zipFile, ExportFile.categoryItems({ categoryUuid }))

// Records
export const getRecords = async (zipFile) => _getJson(zipFile, ExportFile.records)
export const getRecord = async (zipFile, recordUuid) => _getJson(zipFile, ExportFile.record({ recordUuid }))

// Activities
export const getActivities = async (zipFile) => _getJson(zipFile, ExportFile.activityLog)

// Users
export const getUsers = async (zipFile) => _getJson(zipFile, ExportFile.users)

export const getUserProfilePicture = async (zipFile, userUuid) =>
  zipFile.getEntryData(ExportFile.userProfilePicture({ userUuid }))

export const getUserInvitations = async (zipFile) => _getJson(zipFile, ExportFile.userInvitations)

// Chains
export const getChains = async (zipFile) => _getJson(zipFile, ExportFile.chains)
export const getChain = async (zipFile, chainUuid) => _getJson(zipFile, ExportFile.chain({ chainUuid }))
