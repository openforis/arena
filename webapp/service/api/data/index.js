import axios from 'axios'

import * as A from '@core/arena'
import { Query } from '@common/model/query'
import { objectToFormData } from '..'

// ==== RECORD
export const createRecordFromSamplingPointDataItem = async ({ surveyId, itemUuid }) => {
  const { data: recordUuid } = await axios.post(`/api/survey/${surveyId}/record/fromspditem`, { itemUuid })
  return recordUuid
}

// ==== DATA IMPORT
export const startCollectRecordsImportJob = async ({
  surveyId,
  file,
  deleteAllRecords,
  cycle,
  forceImport = false,
} = {}) => {
  const formData = objectToFormData({ file, deleteAllRecords, cycle, forceImport })

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData)
  const { job } = data
  return job
}

export const startDataImportFromCsvJob = async ({ surveyId, cycle, entityDefUuid, file, insertNewRecords }) => {
  const formData = objectToFormData({ cycle, entityDefUuid, file, insertNewRecords })

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcsv`, formData)
  const { job } = data
  return job
}

export const getDataImportFromCsvTemplateUrl = ({ surveyId, entityDefUuid, cycle }) => {
  const params = new URLSearchParams({
    entityDefUuid,
    cycle,
  })
  return `/api/survey/${surveyId}/record/importfromcsv/template?${params.toString()}`
}

// ==== DATA EXPORT
export const startExportDataToCSVJob = async ({ surveyId, options }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/export-csv-data`, options)
  const { job } = data
  return job
}

export const downloadExportedDataToCSVUrl = ({ surveyId, exportUuid }) =>
  `/api/survey/${surveyId}/export-csv-data/${exportUuid}`

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
export const fetchRecordsCountByStep = async ({ surveyId, cycle }) => {
  const { data: countsByStep } = await axios.get(`/api/survey/${surveyId}/records/count/by-step`, { params: { cycle } })
  return countsByStep
}

// ==== UPDATE
export const updateRecordsStep = async ({ surveyId, cycle, stepFrom, stepTo }) => {
  const {
    data: { count },
  } = await axios.post(`/api/survey/${surveyId}/records/step`, { cycle, stepFrom, stepTo })
  return { count }
}
