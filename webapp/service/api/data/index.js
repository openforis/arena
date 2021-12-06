import axios from 'axios'

import * as A from '@core/arena'
import { Query } from '@common/model/query'

// ==== DATA IMPORT
export const importRecordsFromCollect = async ({
  surveyId,
  file,
  deleteAllRecords,
  cycle,
  forceImport = false,
} = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deleteAllRecords', deleteAllRecords)
  formData.append('cycle', cycle)
  formData.append('forceImport', forceImport)

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}

// ==== DATA EXPORT
export const exportDataQueryToTempFile = async ({ surveyId, cycle, query }) => {
  const entityDefUuid = Query.getEntityDefUuid(query)
  const {
    data: { tempFileName },
  } = await axios.post(`/api/surveyRdb/${surveyId}/${entityDefUuid}/export/start`, {
    cycle,
    query: A.stringify(query),
  })
  return tempFileName
}

export const downloadDataQueryExport = ({ surveyId, entityDefUuid, tempFileName }) => {
  window.open(
    `/api/surveyRdb/${surveyId}/${entityDefUuid}/export/download?tempFileName=${tempFileName}`,
    'data-query-export'
  )
}

// ==== READ
export const fetchRecordSummary = async ({ surveyId, cycle, recordUuid }) => {
  const { data: record } = await axios.get(`/api/survey/${surveyId}/record`, { params: { cycle, recordUuid } })
  return record
}

// ==== UPDATE
export const updateRecordsStep = async ({ surveyId, cycle, stepFrom, stepTo }) => {
  const {
    data: { count },
  } = await axios.post(`/api/survey/${surveyId}/records/step`, { cycle, stepFrom, stepTo })
  return { count }
}
