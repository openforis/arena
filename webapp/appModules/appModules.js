const app = 'app'

export const appModules = {
  home: 'home',
  dashboard: 'dashboard',
  survey: 'survey',
  designer: 'designer',

  data: 'data',
  dataRecord: 'data/record',

  analysis: 'analysis',
  users: 'users',
}

export const actionTypes = {
  appModulesDashboardDataLoaded: 'appModules/dashboardData/loaded',
  appModulesDataLoaded: 'appModules/data/loaded',
}

//default home is dashboard
export const appModuleUri = (module = appModules.home) => `/${[app, module].join('/')}/`

