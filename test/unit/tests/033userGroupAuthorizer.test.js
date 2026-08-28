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

describe('Authorizer.canViewSurvey', () => {
  test('system admin can always view', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] }
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(true)
  })

  test('user with an auth group for the survey can view it', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a regular survey', () => {
    const user = { authGroups: [] }
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(false)
  })

  test('user without an auth group can view a published template', () => {
    const user = { authGroups: [] }
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: true }
    expect(Authorizer.canViewSurvey(user, templateSurveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a draft (unpublished) template', () => {
    const user = { authGroups: [] }
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: false }
    expect(Authorizer.canViewSurvey(user, templateSurveyInfo)).toBe(false)
  })
})
