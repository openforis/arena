import axios from 'axios'

import * as A from '@core/arena'
import { Query } from '@common/model/query'
import { ConflictResolutionStrategy } from '@common/dataImport'
import { objectToFormData } from '../utils/apiUtils'

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
  onUploadProgress,
  forceImport = false,
} = {}) => {
  const formData = objectToFormData({ file, deleteAllRecords, cycle, forceImport })

  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcollect`, formData, { onUploadProgress })
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
  onUploadProgress,
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
  const { data } = await axios.post(`/api/survey/${surveyId}/record/importfromcsv`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const startDataImportFromArenaJob = async ({ surveyId, cycle, file, dryRun = false }) => {
  const formData = objectToFormData({
    file,
    cycle,
    dryRun,
    conflictResolutionStrategy: ConflictResolutionStrategy.overwriteIfUpdated,
  })
  const { data } = await axios.post(`/api/mobile/survey/${surveyId}`, formData)
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
  const { data } = await axios.post(`/api/survey/${surveyId}/data-export/csv`, { cycle, ...options })
  const { job } = data
  return job
}

export const downloadExportedDataToCSVUrl = ({ surveyId, cycle, exportUuid }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/data-export/csv/${exportUuid}?${params.toString()}`
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

// ==== RECORDS CLONE
export const startRecordsCloneJob = async ({ surveyId, cycleFrom, cycleTo, recordsUuids }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/records/clone`, { surveyId, cycleFrom, cycleTo, recordsUuids })
  return job
}
