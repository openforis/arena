import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'

const surveyUuid = 'survey-a'
const systemAdminGroup = { uuid: 'g-sa', name: AuthGroup.groupNames.systemAdmin }
const surveyManagerGroup = { uuid: 'g-sm', name: AuthGroup.groupNames.surveyManager }
const groupSurveyA = { uuid: 'g-a', name: AuthGroup.groupNames.dataEditor, surveyUuid }
const groupSurveyB = { uuid: 'g-b', name: AuthGroup.groupNames.surveyAdmin, surveyUuid: 'survey-b' }

const newUser = (authGroups: any[]) => User.assocAuthGroups(authGroups)({ uuid: 'user' })

describe('User auth groups of other surveys', () => {
  test('hasAuthGroupsInOtherSurveys ignores global groups and the groups of the survey', () => {
    const user = newUser([systemAdminGroup, surveyManagerGroup, groupSurveyA])
    expect(User.hasAuthGroupsInOtherSurveys({ surveyUuid })(user)).toBe(false)
  })

  test('hasAuthGroupsInOtherSurveys detects the groups of other surveys', () => {
    const user = newUser([groupSurveyA, groupSurveyB])
    expect(User.hasAuthGroupsInOtherSurveys({ surveyUuid })(user)).toBe(true)
  })

  test('dissocAuthGroupsOfOtherSurveys keeps global groups and the groups of the survey', () => {
    const user = newUser([surveyManagerGroup, groupSurveyA, groupSurveyB])
    const userFiltered = User.dissocAuthGroupsOfOtherSurveys({ surveyUuid })(user)
    expect(User.getAuthGroups(userFiltered)).toEqual([surveyManagerGroup, groupSurveyA])
    expect(User.getAuthGroupsUuids(userFiltered)).toEqual(['g-sm', 'g-a'])
  })

  test('dissocAuthGroupsOfOtherSurveys without survey keeps only global groups', () => {
    const user = newUser([systemAdminGroup, groupSurveyA, groupSurveyB])
    const userFiltered = User.dissocAuthGroupsOfOtherSurveys({ surveyUuid: null })(user)
    expect(User.getAuthGroups(userFiltered)).toEqual([systemAdminGroup])
  })
})
