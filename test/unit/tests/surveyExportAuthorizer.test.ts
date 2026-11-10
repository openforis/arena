import * as AuthGroup from '@core/auth/authGroup'
import { canExportSurveyData } from '@core/auth/surveyExportAuthorizer'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid } as any

const userWithGroup = (groupName: string, groupSurveyUuid: string = surveyUuid): any => ({
  authGroups: [{ name: groupName, surveyUuid: groupSurveyUuid }],
})

describe('canExportSurveyData', () => {
  test('system admin can export the survey data', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] } as any
    expect(canExportSurveyData(user, surveyInfo)).toBe(true)
  })

  test('survey admin can export the survey data', () => {
    expect(canExportSurveyData(userWithGroup(AuthGroup.groupNames.surveyAdmin), surveyInfo)).toBe(true)
  })

  test.each([
    AuthGroup.groupNames.surveyEditor,
    AuthGroup.groupNames.dataAnalyst,
    AuthGroup.groupNames.dataCleanser,
    AuthGroup.groupNames.dataEditor,
    AuthGroup.groupNames.surveyGuest,
  ])('%s cannot export the survey data', (groupName) => {
    expect(canExportSurveyData(userWithGroup(groupName), surveyInfo)).toBe(false)
  })

  test('admin of another survey cannot export the survey data', () => {
    const user = userWithGroup(AuthGroup.groupNames.surveyAdmin, 'survey-2')
    expect(canExportSurveyData(user, surveyInfo)).toBe(false)
  })

  test('no user cannot export the survey data', () => {
    expect(canExportSurveyData(null as any, surveyInfo)).toBe(false)
  })
})
