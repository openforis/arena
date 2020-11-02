import { cancelableGetRequest } from '../cancelableRequest'

export const fetchVariablesPrevSteps = ({ surveyId, entityUuid }) =>
  cancelableGetRequest({
    url: `/api/survey/${surveyId}/processing-chains/variables-prev-steps`,
    data: { entityUuid },
  })
