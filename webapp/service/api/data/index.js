import axios from 'axios'

import { Query } from '@common/model/query'

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
export const fetchRecordsSummary = async ({ surveyId, cycle, recordUuid = null, search = null }) => {
  const {
    data: { list },
  } = await axios.get(`/api/survey/${surveyId}/records/summary`, {
    params: { cycle, recordUuid, search },
  })
  return list
}
export const fetchRecordSummary = async ({ surveyId, cycle, recordUuid }) => {
  const list = await fetchRecordsSummary({ surveyId, cycle, recordUuid })
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
  fileFormat,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  includeFiles = false,
  deleteExistingEntities = false,
  abortOnErrors = true,
  onUploadProgress,
}) => {
  const formData = objectToFormData({
    cycle,
    nodeDefUuid,
    file,
    fileFormat,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    includeFiles,
    deleteExistingEntities,
    abortOnErrors,
  })
  const { data } = await axios.post(`/api/survey/${surveyId}/data-import/flat-data`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const startDataImportFromArenaJob = async ({
  surveyId,
  cycle,
  conflictResolutionStrategy,
  file,
  onUploadProgress,
  dryRun = false,
}) => {
  const formData = objectToFormData({
    file,
    cycle,
    dryRun,
    conflictResolutionStrategy,
  })
  const { data } = await axios.post(`/api/mobile/survey/${surveyId}`, formData, { onUploadProgress })
  const { job } = data
  return job
}

export const getDataImportFromCsvTemplateUrl = ({ surveyId }) =>
  `/api/survey/${surveyId}/data-import/flat-data/template`

export const getDataImportFromCsvTemplatesUrl = ({ surveyId }) =>
  `/api/survey/${surveyId}/data-import/flat-data/templates`

// ==== DATA EXPORT
export const startExportDataJob = async ({ surveyId, cycle, recordUuids, search, options }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/data-export`, {
    cycle,
    recordUuids,
    search,
    options,
  })
  const { job } = data
  return job
}

export const downloadExportedDataUrl = ({ surveyId, cycle, exportUuid }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/data-export/${exportUuid}?${params.toString()}`
}

export const startExportDataSummaryJob = async ({ surveyId, cycle, lang, options }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/data-summary-export`, { cycle, lang, options })
  const { job } = data
  return job
}

export const downloadExportedDataSummaryUrl = ({ surveyId, cycle, exportUuid }) => {
  const params = new URLSearchParams({ cycle })
  return `/api/survey/${surveyId}/data-summary-export/${exportUuid}?${params.toString()}`
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

export const downloadDataQueryExport = ({ surveyId, cycle, entityDefUuid, tempFileName, fileFormat }) => {
  const params = new URLSearchParams({ cycle, tempFileName, fileFormat }).toString()
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

// ==== RECORDS MERGE
export const mergeRecords = async ({ surveyId, sourceRecordUuid, targetRecordUuid, preview = false }) => {
  const uri = `/api/survey/${surveyId}/records/merge`
  const {
    data: { record, nodesCreated, nodesUpdated },
  } = await axios.post(uri, { dryRun: preview, surveyId, sourceRecordUuid, targetRecordUuid })
  return { record, nodesCreated, nodesUpdated }
}
