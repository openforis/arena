import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'

describe('Guest auth group (surveyGuest)', () => {
  test('is one of the default groups of a new survey', () => {
    const groupNames = Survey.getDefaultAuthGroups().map(AuthGroup.getName)
    expect(groupNames).toContain(AuthGroup.groupNames.surveyGuest)
  })

  test('can only view records', () => {
    const guestGroup = Survey.getDefaultAuthGroups().find(
      (group) => AuthGroup.getName(group) === AuthGroup.groupNames.surveyGuest
    )
    expect(guestGroup?.permissions).toEqual([AuthGroup.permissions.recordView])
    expect(AuthGroup.permissionsByGroupName[AuthGroup.groupNames.surveyGuest]).toEqual([
      AuthGroup.permissions.recordView,
    ])
  })
})
