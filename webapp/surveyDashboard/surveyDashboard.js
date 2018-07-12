const surveyDashboard = 'surveyDashboard'

export const surveyDashboardApiUri = surveyId => `/api/surveyDashboard/${surveyId}`

export const modules = {
  survey: 'survey',
  surveyDesigner: 'surveyDesigner',
  dataExplorer: 'dataExplorer',
  dataAnalysis: 'dataAnalysis',
  users: 'users',
}

export const statePaths = {
  survey: [surveyDashboard, modules.survey],
  surveyDesigner: [surveyDashboard, modules.surveyDesigner],
  dataExplorer: [surveyDashboard, modules.dataExplorer],
  dataAnalysis: [surveyDashboard, modules.dataAnalysis],
  users: [surveyDashboard, modules.users],
}

export const actionTypes = {
  surveyDashboardDataComponentLoaded: 'surveyDashboard/dataComponent/loaded',
}

