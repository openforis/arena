import { appModules } from '@webapp/app/appModules'
import * as SideBarModule from '@webapp/views/App/SideBar/Modules/utils'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid, published: true, props: {} }

const userWithGroup = (groupName: string) => ({ authGroups: [{ name: groupName, surveyUuid }] })

const isDashboardVisible = (user: any): boolean => {
  const dashboardModule = SideBarModule.getModulesHierarchy(user, surveyInfo).find(
    (module: any) => SideBarModule.getKey(module) === appModules.dashboard.key
  )
  return Boolean(dashboardModule) && !SideBarModule.isHidden(dashboardModule)
}

describe('SideBar: dashboard module', () => {
  test.each(['systemAdmin', 'surveyManager', 'surveyAdmin', 'surveyEditor'])('visible to %s', (groupName) => {
    expect(isDashboardVisible(userWithGroup(groupName))).toBe(true)
  })

  test.each(['dataAnalyst', 'dataCleanser', 'dataEditor', 'surveyGuest'])('hidden to %s', (groupName) => {
    expect(isDashboardVisible(userWithGroup(groupName))).toBe(false)
  })
})
