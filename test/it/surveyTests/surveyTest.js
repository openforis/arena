import {assert} from 'chai'
import {uuidv4} from '@core/uuid'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as Survey from '@core/survey/survey'
import {setContextSurvey, getContextUser} from '../../testContext'

const testSurvey = {
  name: 'do_not_use__test_survey_' + uuidv4(),
  label: 'DO NOT USE! Test Survey',
  languages: ['en']
}

export const createSurveyTest = async () => {
  const survey = await SurveyManager.createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), testSurvey.name)
  const expectedDefaultLanguage = testSurvey.languages[0]
  assert.equal(Survey.getLanguage(expectedDefaultLanguage)(surveyInfo), expectedDefaultLanguage)
  assert.equal(Survey.getDefaultLabel(surveyInfo), testSurvey.label)
}

// Const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }
