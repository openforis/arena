/**
 * The changelog is visible to system admins, survey managers and survey admins (of at least one survey).
 */
import * as AuthGroup from '@core/auth/authGroup'
import { canViewChangelog } from '@core/auth/changelogAuthorizer'

const userWithGroups = (...groupNames: string[]) => ({
  authGroups: groupNames.map((name, index) => ({ name, surveyUuid: `survey-${index}` })),
})

describe('canViewChangelog', () => {
  test('visible to system admins, survey managers and survey admins', () => {
    expect(canViewChangelog({ authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] })).toBe(true)
    expect(canViewChangelog({ authGroups: [{ name: AuthGroup.groupNames.surveyManager }] })).toBe(true)
    expect(canViewChangelog(userWithGroups(AuthGroup.groupNames.surveyAdmin))).toBe(true)
    expect(canViewChangelog(userWithGroups(AuthGroup.groupNames.dataEditor, AuthGroup.groupNames.surveyAdmin))).toBe(
      true
    )
  })

  test('not visible to the other roles', () => {
    for (const groupName of [
      AuthGroup.groupNames.surveyEditor,
      AuthGroup.groupNames.dataAnalyst,
      AuthGroup.groupNames.dataCleanser,
      AuthGroup.groupNames.dataEditor,
      AuthGroup.groupNames.surveyGuest,
    ]) {
      expect(canViewChangelog(userWithGroups(groupName))).toBe(false)
    }
    expect(canViewChangelog({ authGroups: [] })).toBe(false)
    expect(canViewChangelog(null)).toBe(false)
  })
})
