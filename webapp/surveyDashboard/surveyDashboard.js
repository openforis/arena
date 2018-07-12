const surveyDashboard = 'surveyDashboard'

export const surveyDashboardApiUri = surveyId => `/api/surveyDashboard/${surveyId}`

export const dataComponentType = {
  survey: 'survey',
  surveyDesigner: 'surveyDesigner',
  dataExplorer: 'dataExplorer',
  dataAnalysis: 'dataAnalysis',
  users: 'users',
}

export const statePaths = {
  survey: [surveyDashboard, dataComponentType.survey],
  surveyDesigner: [surveyDashboard, dataComponentType.surveyDesigner],
  dataExplorer: [surveyDashboard, dataComponentType.dataExplorer],
  dataAnalysis: [surveyDashboard, dataComponentType.dataAnalysis],
  users: [surveyDashboard, dataComponentType.users],
}

export const actionTypes = {
  surveyDashboardDataComponentLoaded: 'surveyDashboard/dataComponent/loaded',
}

