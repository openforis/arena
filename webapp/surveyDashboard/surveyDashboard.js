export const surveyDashboardApiUri = surveyId => `/api/surveyDashboard/${surveyId}`

const surveyDashboard = 'surveyDashboard'
export const statePaths = {
  survey: [surveyDashboard, 'survey'],
  surveyDesigner: [surveyDashboard, 'surveyDesigner'],
  dataExplorer: [surveyDashboard, 'dataExplorer'],
}

export const actionTypes = {
  surveyLoaded: 'surveyDashboard/survey/loaded',

  surveyDesignerLoaded: 'surveyDashboard/surveyDesigner/loaded',

  dataExplorerLoaded: 'surveyDashboard/dataExplorer/loaded',
}

