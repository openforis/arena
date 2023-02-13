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

export const startDataImportFromCsvJob = async ({
  surveyId,
  cycle,
  entityDefUuid,
  file,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  abortOnErrors = true,
}) => {
  const formData = objectToFormData({
    cycle,
    entityDefUuid,
    file,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    abortOnErrors,
  })
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
export const startExportDataToCSVJob = async ({ surveyId, cycle, options }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/export-csv-data`, { cycle, ...options })
  const { job } = data
  return job
}

export const downloadExportedDataToCSVUrl = ({ surveyId, cycle, exportUuid }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/export-csv-data/${exportUuid}?${params.toString()}`
}

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

export const downloadDataQueryExport = ({ surveyId, cycle, entityDefUuid, tempFileName }) => {
  const params = new URLSearchParams({ cycle, tempFileName }).toString()
  window.open(`/api/surveyRdb/${surveyId}/${entityDefUuid}/export/download?${params}`, 'data-query-export')
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
