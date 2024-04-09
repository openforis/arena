import axios from 'axios'

import { DataQuerySummaries } from '@openforis/arena-core'

import * as A from '@core/arena'

const getDataQueriesEndpoint = ({ surveyId }) => `/api/survey/${surveyId}/data_queries`
const getDataQueryEndpoint = ({ surveyId, querySummaryUuid }) =>
  `${getDataQueriesEndpoint({ surveyId })}/${querySummaryUuid}`

// CREATE
export const insertDataQuerySummary = async ({ surveyId, querySummary }) => {
  const querySummaryUuid = DataQuerySummaries.getUuid(querySummary)
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const querySummaryModified = { ...querySummary, content: A.stringify(DataQuerySummaries.getContent(querySummary)) }
  const {
    data: { querySummary: querySummaryInserted },
  } = await axios.post(url, querySummaryModified)
  return querySummaryInserted
}

// READ
export const fetchDataQuerySummary = async ({ surveyId, querySummaryUuid }) => {
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryFetched } = await axios.get(url)
  return {
    ...querySummaryFetched,
    content: A.parse(DataQuerySummaries.getContent(querySummaryFetched)),
  }
}

// UPDATE
export const updateDataQuerySummary = async ({ surveyId, querySummary }) => {
  const querySummaryUuid = DataQuerySummaries.getUuid(querySummary)
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const {
    data: { querySummary: querySummaryUpdated },
  } = await axios.put(url, querySummary)
  return querySummaryUpdated
}
