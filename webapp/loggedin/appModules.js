const app = 'app'

export const appModules = {
  home: 'home',
  dashboard: 'dashboard',
  survey: 'survey',
  designer: 'designer',
  data: 'data',
  analysis: 'analysis',
  users: 'users',
}

export const appModuleUri = (module = appModules.home) => `/${[app, module].join('/')}/`
