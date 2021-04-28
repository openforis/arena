const fs = require('fs')
const path = require('path')

const downloadsPath = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, 'downloads')
const getSurveyZipPath = (survey) => path.resolve(downloadsPath, `survey_${survey.name}.zip`)
const getSurveyDirPath = (survey) => path.resolve(downloadsPath, `survey_${survey.name}`)
const getSurveyEntry = (survey, entryPath) => {
  const content = fs.readFileSync(path.resolve(getSurveyDirPath(survey), entryPath), 'utf8')
  return JSON.parse(content)
}

module.exports = {
  downloadsPath,
  getSurveyZipPath,
  getSurveyDirPath,
  getSurveyEntry,
}
