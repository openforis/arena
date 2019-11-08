import * as Survey from '@core/survey/survey'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'

import * as User from '@core/user/user'

let user = null
let survey = null

/**
 * Initializing test context (user)
 * before executing all tests
 */
export const initTestContext = async () => {
  user = await UserManager.fetchUserByEmail('admin@openforis.org')
}

export const destroyTestContext = async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
}

export const setContextSurvey = s => {
  survey = s
  user = User.assocPrefSurveyCurrent(Survey.getId(survey))(user)
}

export const fetchFullContextSurvey = async (draft = true, advanced = true) =>
  await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(Survey.getId(survey), Survey.cycleOneKey, draft, advanced)

export const getContextUser = () => user
export const getContextSurvey = () => survey
export const getContextSurveyId = () => Survey.getId(survey)

