import { appModules } from '../app/app'

const surveyDashboard = 'surveyDashboard'

export const surveyDashboardApiUri = surveyId => `/api/surveyDashboard/${surveyId}`

export const statePaths = {
  survey: [surveyDashboard, appModules.survey],
  surveyDesigner: [surveyDashboard, appModules.surveyDesigner],
  dataExplorer: [surveyDashboard, appModules.dataExplorer],
  dataAnalysis: [surveyDashboard, appModules.dataAnalysis],
  users: [surveyDashboard, appModules.users],
}

export const actionTypes = {
  surveyDashboardDataComponentLoaded: 'surveyDashboard/dataComponent/loaded',
}

