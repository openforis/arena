import fs from 'fs'
import path from 'path'

const getSurvey = ({ surveyExtractedPath }) => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  return survey
}

export const checkSurvey = async ({ surveyExtractedPath, values }) => {
  await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
  const survey = getSurvey({ surveyExtractedPath })
  const { name, languages = ['en', 'fr'], info = { en: 'Survey' } } = values
  await expect(survey?.info?.name).toBe(name)
  await expect(survey?.info?.labels).toMatchObject(info)
  const _languages = survey?.info?.languages
  await expect(_languages.sort()).toEqual(languages.sort())
}
