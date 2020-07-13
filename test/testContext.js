import * as AuthGroup from '../core/auth/authGroup'
import * as Survey from '../core/survey/survey'
import * as User from '../core/user/user'

import { db } from '../server/db/db'
import * as SurveyManager from '../server/modules/survey/manager/surveyManager'
import * as UserManager from '../server/modules/user/manager/userManager'

let user = null
let survey = null

export const setContextUser = (userToSave) => {
  global.user = userToSave
  user = userToSave
}

export const getContextUser = () => {
  return global.user || user
}
export const getContextSurvey = () => global.survey || survey
export const getContextSurveyId = () => Survey.getId(getContextSurvey())

const createAdminUser = async () =>
  await db.multi(`
    -- Insert the admin user to be used in the test suite:
    INSERT INTO "user" (name, email, password, status)
    values ('Admin', 'admin@openforis.org', 'test_password', '${User.userStatus.ACCEPTED}')
    ON CONFLICT DO NOTHING;

    INSERT INTO auth_group_user (user_uuid, group_uuid)
    SELECT u.uuid, g.uuid
    FROM "user" u, "auth_group" g
    WHERE u.email = 'admin@openforis.org' AND g.name = '${AuthGroup.groupNames.systemAdmin}'
    ON CONFLICT DO NOTHING;
    `)

/**
 * Initializing test context (user)
 * before executing all tests
 */
export const initTestContext = async () => {
  await createAdminUser()
  const userSaved = await UserManager.fetchUserByEmail('admin@openforis.org')
  setContextUser(userSaved)
}

export const setContextSurvey = (s) => {
  global.survey = s
  survey = s
  setContextUser(User.assocPrefSurveyCurrent(Survey.getId(getContextSurvey()))(getContextUser()))
}

export const destroyTestContext = async () => {
  if (getContextUser() && getContextSurveyId()) {
    await SurveyManager.deleteSurvey(getContextSurveyId())
    setContextSurvey(null)
    setContextUser(null)
  }
  return null
}

export const fetchFullContextSurvey = async (draft = true, advanced = true) =>
  await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(getContextSurveyId(), Survey.cycleOneKey, draft, advanced)
