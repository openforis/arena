import * as AuthGroup from '../core/auth/authGroup'
import * as Survey from '../core/survey/survey'
import * as User from '../core/user/user'

import { db } from '../server/db/db'
import * as SurveyManager from '../server/modules/survey/manager/surveyManager'
import * as UserManager from '../server/modules/user/manager/userManager'

let user = null
let survey = null

const createAdminUser = async () => {
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
}

/**
 * Initializing test context (user)
 * before executing all tests
 */
export const initTestContext = async () => {
  await createAdminUser()
  user = await UserManager.fetchUserByEmail('admin@openforis.org')
}

export const destroyTestContext = async () => {
  if (survey) {
    await SurveyManager.deleteSurvey(Survey.getId(survey))
  }
}

export const setContextSurvey = (s) => {
  survey = s
  user = User.assocPrefSurveyCurrent(Survey.getId(survey))(user)
}

export const fetchFullContextSurvey = async (draft = true, advanced = true) =>
  await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(Survey.getId(survey), Survey.cycleOneKey, draft, advanced)

export const getContextUser = () => user
export const getContextSurvey = () => survey
export const getContextSurveyId = () => Survey.getId(survey)
