import axios from 'axios'

import { DataQuerySummaries, Objects } from '@openforis/arena-core'

const getDataQueriesEndpoint = ({ surveyId }) => `/api/survey/${surveyId}/data_queries`
const getDataQueryEndpoint = ({ surveyId, querySummaryUuid }) =>
  `${getDataQueriesEndpoint({ surveyId })}/${querySummaryUuid}`

const _prepareDataQuerySummaryToStore = (querySummary) => {
  const contentOriginal = DataQuerySummaries.getContent(querySummary)
  const content = Objects.stringify(contentOriginal)
  return { ...querySummary, content }
}

const _parseQuerySummaryFetchedWithContent = (querySummaryFetched) => {
  const contentFetched = DataQuerySummaries.getContent(querySummaryFetched)
  const contentToString = JSON.stringify(contentFetched)
  const content = Objects.parse(contentToString)
  return { ...querySummaryFetched, content }
}

// CREATE
export const insertDataQuerySummary = async ({ surveyId, querySummary }) => {
  const querySummaryUuid = DataQuerySummaries.getUuid(querySummary)
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const querySummaryToStore = _prepareDataQuerySummaryToStore(querySummary)
  const { data: querySummaryInserted } = await axios.post(url, querySummaryToStore)
  return querySummaryInserted
}

// READ
export const fetchDataQuerySummary = async ({ surveyId, querySummaryUuid }) => {
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryFetched } = await axios.get(url)
  return _parseQuerySummaryFetchedWithContent(querySummaryFetched)
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
  const querySummaryToStore = _prepareDataQuerySummaryToStore(querySummary)
  const { data: querySummaryUpdated } = await axios.put(url, querySummaryToStore)
  return querySummaryUpdated
}

// DELETE
export const deleteDataQuerySummary = async ({ surveyId, querySummaryUuid }) => {
  const url = getDataQueryEndpoint({ surveyId, querySummaryUuid })
  const { data: querySummaryDeleted } = await axios.delete(url)
  return querySummaryDeleted
}
