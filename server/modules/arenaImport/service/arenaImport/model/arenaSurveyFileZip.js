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
