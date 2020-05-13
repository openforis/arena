import { assert } from 'chai'

import { uuidv4 } from '../../../core/uuid'
import * as Survey from '../../../core/survey/survey'
import * as User from '../../../core/user/user'

import * as SurveyManager from '../../../server/modules/survey/manager/surveyManager'
import { setContextSurvey, getContextUser } from '../../testContext'

export const createSurveyTest = async () => {
  const user = getContextUser()

  const surveyInfoTest = Survey.newSurvey({
    ownerUuid: User.getUuid(user),
    name: `do_not_use__test_survey_${uuidv4()}`,
    label: 'DO NOT USE! Test Survey',
    languages: ['en'],
  })
  const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTest })

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), Survey.getName(surveyInfoTest))
  const expectedDefaultLanguage = Survey.getDefaultLanguage(surveyInfoTest)
  assert.equal(Survey.getDefaultLanguage(surveyInfo), expectedDefaultLanguage)
  assert.equal(Survey.getDefaultLabel(surveyInfo), Survey.getDefaultLabel(surveyInfoTest))
}
