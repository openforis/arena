export const getPaths = (streamZipFile) => streamZipFile.getEntryNames()

export const getPath = (pattern) => (entries) => entries.find((entry) => new RegExp(pattern).test(entry))

export const getPathByUuid = (uuid, extension = 'json') => (entries) =>
  entries.find((entry) => new RegExp(`${uuid}.${extension}$`).test(entry))

// Survey
export const getSurveyPath = getPath('survey.json$')

export const getSurvey = async (streamZipFile) => {
  const surveyPath = getSurveyPath(getPaths(streamZipFile))
  const arenaSurvey = await streamZipFile.getEntryData(surveyPath)
  return JSON.parse(arenaSurvey)
}

// Taxonomies
export const getTaxonomiesPath = getPath('taxonomies.json$')
export const getTaxonomies = async (streamZipFile) => {
  const taxonomiesPath = getTaxonomiesPath(getPaths(streamZipFile))
  const arenaTaxonomies = await streamZipFile.getEntryData(taxonomiesPath)
  return JSON.parse(arenaTaxonomies)
}
export const getTaxa = async (streamZipFile, uuid) => {
  const taxaPath = getPathByUuid(uuid)(getPaths(streamZipFile))
  const arenaTaxa = await streamZipFile.getEntryData(taxaPath)
  return JSON.parse(arenaTaxa)
}

// Categories
export const getCategoriesPath = getPath('categories.json$')
export const getCategories = async (streamZipFile) => {
  const categoriesPath = getCategoriesPath(getPaths(streamZipFile))
  const arenaCategories = await streamZipFile.getEntryData(categoriesPath)
  return JSON.parse(arenaCategories)
}
export const getCategoryItems = async (streamZipFile, categoryUuid) => {
  const itemsPath = getPathByUuid(categoryUuid)(getPaths(streamZipFile))
  const items = await streamZipFile.getEntryData(itemsPath)
  return JSON.parse(items)
}

// Records
export const getRecordsPath = getPath('records.json$')
export const getRecords = async (streamZipFile) => {
  const recordsPath = getRecordsPath(getPaths(streamZipFile))
  const records = await streamZipFile.getEntryData(recordsPath)
  return JSON.parse(records)
}
export const getRecord = async (streamZipFile, uuid) => {
  const recordPath = getPathByUuid(uuid)(getPaths(streamZipFile))
  const record = await streamZipFile.getEntryData(recordPath)
  return JSON.parse(record)
}

// Activities
export const getActivitiesPath = getPath('activitylog.json$')
export const getActivities = async (streamZipFile) => {
  const activitiesPath = getActivitiesPath(getPaths(streamZipFile))
  const activities = await streamZipFile.getEntryData(activitiesPath)
  return JSON.parse(activities)
}

// Users
export const getUsersPath = getPath('users.json$')
export const getUsers = async (streamZipFile) => {
  const usersPath = getUsersPath(getPaths(streamZipFile))
  const users = await streamZipFile.getEntryData(usersPath)
  return JSON.parse(users)
}
export const getUser = async (streamZipFile, uuid) => {
  const userPath = getPathByUuid(uuid)(getPaths(streamZipFile))
  const user = await streamZipFile.getEntryData(userPath)
  return JSON.parse(user)
}
export const getProfilePicturePathByUuid = (uuid) => (entries) =>
  entries.find((entry) => new RegExp(`profilepictures/${uuid}`).test(entry))

export const getUserProfilePicture = async (streamZipFile, uuid) => {
  const profilePicturePath = getProfilePicturePathByUuid(uuid)(getPaths(streamZipFile))
  if (profilePicturePath) {
    const profilePicture = await streamZipFile.getEntryData(profilePicturePath)
    return profilePicture
  }
  return false
}

// Chains
export const getChainsPath = getPath('chains.json$')
export const getChains = async (streamZipFile) => {
  const chainsPath = getChainsPath(getPaths(streamZipFile))
  const chains = await streamZipFile.getEntryData(chainsPath)
  return JSON.parse(chains)
}
export const getChain = async (streamZipFile, uuid) => {
  const chainPath = getPathByUuid(uuid)(getPaths(streamZipFile))
  const chain = await streamZipFile.getEntryData(chainPath)
  return JSON.parse(chain)
}
