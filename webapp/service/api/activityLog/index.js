import { cancelableRequest } from '../cancelableRequest'

export const fetchActivityLogs = ({ surveyId, params = {} }) =>
  cancelableRequest({
    url: `/api/survey/${surveyId}/activity-log`,
    config: { params },
  })
