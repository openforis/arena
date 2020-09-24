import { cancelableGetRequest } from '../cancelableRequest'

export const fetchActivityLogs = ({ surveyId, params = {} }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/activity-log`,
    data: params,
  })
