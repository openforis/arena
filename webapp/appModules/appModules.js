import * as R from 'ramda'
import { appModuleUri } from '../app/app'

const rootStatePath = 'appModules'

export const appDashboard = 'dashboard'

export const apiUri = (surveyId, module, dashboard = false) => (
  `/api/appModules/${module}${dashboard ? '/dashboard' : ''}/${surveyId}`
)

export const appModules = {
  home: 'home',
  surveyDashboard: 'surveyDashboard',
  survey: 'survey',
  surveyDesigner: 'surveyDesigner',
  dataExplorer: 'dataExplorer',
  dataAnalysis: 'dataAnalysis',
  record: 'record',
  users: 'users',
}

export const getData = (module) => R.path([rootStatePath, module, 'data'])

export const getDashboardData = (module) => R.path([rootStatePath, module, 'dashboard'])

export const actionTypes = {
  appModulesDashboardDataLoaded: 'appModules/dashboardData/loaded',
  appModulesDataLoaded: 'appModules/data/loaded',
}

export const appModulesPath = {

  matches: (path, module) => path === appModuleUri(module),

}

