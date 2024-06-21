import axios from 'axios'

import { Query } from '@common/model/query'
import { ConflictResolutionStrategy } from '@common/dataImport'
import { objectToFormData } from '../utils/apiUtils'

// ==== RECORD
export const createRecordFromSamplingPointDataItem = async ({ surveyId, itemUuid }) => {
  const { data: recordUuid } = await axios.post(`/api/survey/${surveyId}/record/fromspditem`, { itemUuid })
  return recordUuid
}
export const fetchRecordsCountByStep = async ({ surveyId, cycle }) => {
  const { data: countsByStep } = await axios.get(`/api/survey/${surveyId}/records/count/by-step`, { params: { cycle } })
  return countsByStep
}
export const fetchRecordSummary = async ({ surveyId, cycle, recordUuid }) => {
  const {
    data: { list },
  } = await axios.get(`/api/survey/${surveyId}/records/summary`, {
    params: { cycle, recordUuid },
  })
  return list?.[0]
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

  const { data } = await axios.post(`/api/survey/${surveyId}/data-import/collect`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const startDataImportFromCsvJob = async ({
  surveyId,
  cycle,
  nodeDefUuid,
  file,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  includeFiles = false,
  abortOnErrors = true,
  onUploadProgress,
}) => {
  const formData = objectToFormData({
    cycle,
    nodeDefUuid,
    file,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    includeFiles,
    abortOnErrors,
  })
  const { data } = await axios.post(`/api/survey/${surveyId}/data-import/csv`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const startDataImportFromArenaJob = async ({ surveyId, cycle, file, onUploadProgress, dryRun = false }) => {
  const formData = objectToFormData({
    file,
    cycle,
    dryRun,
    conflictResolutionStrategy: ConflictResolutionStrategy.overwriteIfUpdated,
  })
  const { data } = await axios.post(`/api/mobile/survey/${surveyId}`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const getDataImportFromCsvTemplateUrl = ({ surveyId, nodeDefUuid, cycle }) => {
  const params = new URLSearchParams({ nodeDefUuid, cycle })
  return `/api/survey/${surveyId}/data-import/csv/template?${params.toString()}`
}

export const getDataImportFromCsvTemplatesUrl = ({ surveyId, cycle }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/data-import/csv/templates?${params.toString()}`
}

// ==== DATA EXPORT
export const startExportDataToCSVJob = async ({ surveyId, cycle, recordUuids, search, options }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/data-export/csv`, {
    cycle,
    recordUuids,
    search,
    ...options,
  })
  const { job } = data
  return job
}

export const downloadExportedDataToCSVUrl = ({ surveyId, cycle, exportUuid }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/data-export/csv/${exportUuid}?${params.toString()}`
}

export const exportDataQueryToTempFile = async ({ surveyId, cycle, query, options }) => {
  const entityDefUuid = Query.getEntityDefUuid(query)
  const {
    data: { tempFileName },
  } = await axios.post(`/api/surveyRdb/${surveyId}/${entityDefUuid}/export/start`, {
    cycle,
    query,
    options,
  })
  return tempFileName
}

export const downloadDataQueryExport = ({ surveyId, cycle, entityDefUuid, tempFileName }) => {
  const params = new URLSearchParams({ cycle, tempFileName }).toString()
  window.open(`/api/surveyRdb/${surveyId}/${entityDefUuid}/export/download?${params}`, 'data-query-export')
}

// ==== UPDATE
export const updateRecordsStep = async ({ surveyId, cycle, stepFrom, stepTo, recordUuids }) => {
  const {
    data: { count },
  } = await axios.post(`/api/survey/${surveyId}/records/step`, { cycle, stepFrom, stepTo, recordUuids })
  return { count }
}

export const updateRecordOwner = async ({ surveyId, recordUuid, ownerUuid }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/owner`, { ownerUuid })
  return data
}

// ==== RECORDS CLONE
export const startRecordsCloneJob = async ({ surveyId, cycleFrom, cycleTo, recordsUuids }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/records/clone`, { surveyId, cycleFrom, cycleTo, recordsUuids })
  return job
}
