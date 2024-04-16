import axios from 'axios'

import { DataQuerySummaries } from '@openforis/arena-core'

const getDataQueriesEndpoint = ({ surveyId }) => `/api/survey/${surveyId}/data_queries`
const getDataQueryEndpoint = ({ surveyId, querySummaryUuid }) =>
  `${getDataQueriesEndpoint({ surveyId })}/${querySummaryUuid}`

// CREATE
export const insertDataQuerySummary = async ({ surveyId, querySummary }) => {
  const querySummaryUuid = DataQuerySummaries.getUuid(querySummary)
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryInserted } = await axios.post(url, querySummary)
  return querySummaryInserted
}

// READ
export const fetchDataQuerySummary = async ({ surveyId, querySummaryUuid }) => {
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryFetched } = await axios.get(url)
  return querySummaryFetched
}

export const fetchDataQuerySummaries = async ({ surveyId }) => {
  const url = getDataQueriesEndpoint({ surveyId })
  const {
    data: { list },
  } = await axios.get(url)
  return list
}

// UPDATE
export const updateDataQuerySummary = async ({ surveyId, querySummary }) => {
  const querySummaryUuid = DataQuerySummaries.getUuid(querySummary)
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryUpdated } = await axios.put(url, querySummary)
  return querySummaryUpdated
}

// DELETE
export const deleteDataQuerySummary = async ({ surveyId, querySummaryUuid }) => {
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryDeleted } = await axios.delete(url)
  return querySummaryDeleted
}
