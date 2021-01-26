export const getPaths = (streamZipFile) => streamZipFile.getEntryNames()

export const getPath = (pattern) => (entries) => entries.find((entry) => new RegExp(pattern).test(entry))

// Survey
export const getSurveyPath = getPath('survey.json$')

export const getSurvey = async (streamZipFile) => {
  const surveyPath = getSurveyPath(getPaths(streamZipFile))
  const arenaSurvey = await streamZipFile.getEntryData(surveyPath)
  return JSON.parse(arenaSurvey)
}
