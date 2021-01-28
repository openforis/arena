import fs from 'fs'
import path from 'path'
import * as Survey from '@core/survey/survey'

const getSurvey = ({ surveyExtractedPath }) => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  return survey
}

export const checkSurvey = async ({ surveyExtractedPath, values }) => {
  await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
  const survey = getSurvey({ surveyExtractedPath })
  const { name, languages = ['en', 'fr'], info = { en: 'Survey' } } = values
  await expect(Survey.getName(Survey.getSurveyInfo(survey))).toBe(name)
  await expect(Survey.getLabels(Survey.getSurveyInfo(survey))).toMatchObject(info)
  const _languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
  await expect(_languages.sort()).toEqual(languages.sort())
}
