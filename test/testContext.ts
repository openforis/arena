import Survey from '../core/survey/survey';
import SurveyManager from '../server/modules/survey/manager/surveyManager';
import UserManager from '../server/modules/user/manager/userManager';
import User from '../core/user/user';

let user: any = null
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

// TODO: cycleOneKey is a string '0' by default, but the function takes a bool apparently
export const fetchFullContextSurvey = async (draft = true, advanced = true) => {
  return await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(Survey.getId(survey), Survey.cycleOneKey, draft, advanced)
}
export const getContextUser = () => user
export const getContextSurvey = () => survey
export const getContextSurveyId = () => Survey.getId(survey)
