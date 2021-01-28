import fs from 'fs'
import path from 'path'

export const checkFileAndGetContent = async ({ filePath }) => {
  await expect(fs.existsSync(filePath)).toBeTruthy()
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

export const getSurvey = ({ surveyExtractedPath }) => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  return survey
}
