const fs = require('fs')
const path = require('path')

const downloadsPath = process.env.GITHUB_WORKSPACE || __dirname
const downloadsSurveysPath = path.resolve(downloadsPath, 'surveys')
const getSurveyZipPath = (survey) => path.resolve(downloadsSurveysPath, `survey_${survey.name}.zip`)
const getSurveyDirPath = (survey) => path.resolve(downloadsSurveysPath, `survey_${survey.name}`)
const getSurveyEntry = (survey, ...entry) => {
  const content = fs.readFileSync(path.resolve(getSurveyDirPath(survey), ...entry), 'utf8')
  return JSON.parse(content)
}

module.exports = {
  downloadsPath,
  downloadsSurveysPath,
  getSurveyZipPath,
  getSurveyDirPath,
  getSurveyEntry,
}
