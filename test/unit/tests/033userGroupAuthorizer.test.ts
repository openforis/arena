import { type ArenaSurvey, type ArenaUser, Authorizer } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid } as ArenaSurvey

const userWithGroup = (groupName) =>
  ({
    authGroups: [{ name: groupName, surveyUuid }],
  }) as ArenaUser

describe('Authorizer.canManageUserGroups', () => {
  test('system admin can always manage', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] } as ArenaUser
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
  test('user without an auth group cannot view a regular survey', () => {
    const user = { authGroups: [] } as ArenaUser
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(false)
  })

  test('user without an auth group cannot view a published template either (unchanged, narrow scope)', () => {
    const user = { authGroups: [] } as ArenaUser
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: true } as ArenaSurvey
    expect(Authorizer.canViewSurvey(user, templateSurveyInfo)).toBe(false)
  })
})

describe('Authorizer.canViewSurveyOrPublishedTemplate', () => {
  test('system admin can always view', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] } as ArenaUser
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, surveyInfo)).toBe(true)
  })

  test('user with an auth group for the survey can view it', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, surveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a regular survey', () => {
    const user = { authGroups: [] } as ArenaUser
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, surveyInfo)).toBe(false)
  })

  test('user without an auth group can view a published template', () => {
    const user = { authGroups: [] } as ArenaUser
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: true } as ArenaSurvey
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, templateSurveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a draft (unpublished) template', () => {
    const user = { authGroups: [] } as ArenaUser
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: false } as ArenaSurvey
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, templateSurveyInfo)).toBe(false)
  })

  test('falsy user cannot view a published template', () => {
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: true } as ArenaSurvey
    expect(Authorizer.canViewSurveyOrPublishedTemplate(null, templateSurveyInfo)).toBe(false)
  })

  test('user with an auth group can view even an unpublished template', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: false } as unknown as ArenaSurvey
    expect(Authorizer.canViewSurveyOrPublishedTemplate(user, templateSurveyInfo)).toBe(true)
  })
})
