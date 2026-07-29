import * as Authorizer from '@core/auth/authorizer'
import * as AuthGroup from '@core/auth/authGroup'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid }

const userWithGroup = (groupName) => ({
  authGroups: [{ name: groupName, surveyUuid }],
})

describe('Authorizer.canManageUserGroups', () => {
  test('system admin can always manage', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] }
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(true)
  })

  test('survey admin of the given survey can manage', () => {
    const user = userWithGroup(AuthGroup.groupNames.surveyAdmin)
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(true)
  })

  test('data editor (non-admin) user cannot manage', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(false)
  })

  test('no user cannot manage', () => {
    expect(Authorizer.canManageUserGroups(null, surveyInfo)).toBe(false)
  })
})
