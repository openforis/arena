import axios from 'axios'

import { ApiEndpoint, DataQuerySummaries } from '@openforis/arena-server'

// CREATE
export const insertDataQuerySummary = async ({ surveyId, querySummary }) => {
  const {
    data: { querySummary: querySummaryInserted },
  } = await axios.post(
    ApiEndpoint.dataQuery.dataQuery(surveyId, DataQuerySummaries.getUuid(querySummary)),
    querySummary
  )
  return querySummaryInserted
}

// UPDATE
export const updateDataQuerySummary = async ({ surveyId, querySummary }) => {
  const {
    data: { querySummary: querySummaryUpdated },
  } = await axios.put(ApiEndpoint.dataQuery.dataQuery(surveyId, DataQuerySummaries.getUuid(querySummary)), querySummary)
  return querySummaryUpdated
}
