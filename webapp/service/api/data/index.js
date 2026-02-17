import axios from 'axios'

import { FileProcessor } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as Node from '@core/record/node'

import { Chunks } from '@webapp/utils/chunks'

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

// ==== RECORD FILE
export const getRecordNodeFileUrl = ({ surveyId, node }) =>
  `/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/nodes/${Node.getIId(node)}/file`

export const fetchRecordsNodeFileExifInfo = async ({ surveyId, node }) => {
  const { data: info } = await axios.get(`${getRecordNodeFileUrl({ surveyId, node })}-exif`)
  return info
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

export const startDataImportFromCsvJob = ({
  surveyId,
  cycle,
  nodeDefUuid,
  file,
  fileId,
  startFromChunk = 1,
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
  let fileProcessor = null
  const promise = new Promise((resolve, reject) => {
    fileProcessor = new FileProcessor({
      file,
      chunkProcessor: async ({ chunk, totalChunks, content }) => {
        const formData = objectToFormData({
          cycle,
          nodeDefUuid,
          fileId,
          file: content,
          chunk,
          totalChunks,
          fileFormat,
          dryRun,
          insertNewRecords,
          insertMissingNodes,
          updateRecordsInAnalysis,
          includeFiles,
          deleteExistingEntities,
          abortOnErrors,
        })
        const { data } = await axios.post(`/api/survey/${surveyId}/data-import/flat-data`, formData, {
          onUploadProgress: Chunks.onUploadProgress({ totalChunks, chunk, onUploadProgress }),
        })
        return data
      },
      onComplete: (data) => {
        resolve(data.job)
      },
      onError: (error) => {
        reject(error)
      },
    })
    fileProcessor.start(startFromChunk)
  })
  return { promise, processor: fileProcessor }
}

export const startDataImportFromArenaJob = ({
  surveyId,
  cycle,
  conflictResolutionStrategy,
  file,
  fileId,
  chunkSize,
  onUploadProgress,
  dryRun = false,
  startFromChunk = 1,
}) => {
  const commonParameters = {
    fileId,
    cycle,
    dryRun,
    conflictResolutionStrategy,
  }
  if (chunkSize > 0) {
    let fileProcessor = null
    const promise = new Promise((resolve, reject) => {
      fileProcessor = new FileProcessor({
        file,
        chunkSize,
        chunkProcessor: async ({ chunk, totalChunks, content }) => {
          const formData = objectToFormData({
            ...commonParameters,
            file: content,
            chunk,
            totalChunks,
          })
          const { data } = await axios.post(`/api/mobile/survey/${surveyId}`, formData, {
            onUploadProgress: Chunks.onUploadProgress({ totalChunks, chunk, onUploadProgress }),
          })
          return data
        },
        onComplete: (data) => {
          resolve(data.job)
        },
        onError: (error) => {
          reject(error)
        },
      })
      fileProcessor.start(startFromChunk)
    })
    return { promise, processor: fileProcessor }
  } else {
    const formData = objectToFormData({ ...commonParameters, file })
    const promise = axios.post(`/api/mobile/survey/${surveyId}`, formData, { onUploadProgress })
    return { promise }
  }
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
    data: { downloadToken },
  } = await axios.post(`/api/surveyRdb/${surveyId}/${entityDefUuid}/export/start`, {
    cycle,
    query,
    options,
  })
  return { downloadToken }
}

export const downloadDataQueryExport = ({ surveyId, cycle, entityDefUuid, fileFormat, downloadToken }) => {
  const params = new URLSearchParams({ cycle, fileFormat, downloadToken }).toString()
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

// RECORDS VALIDAATION
export const startRecordsValidationJob = async ({ surveyId }) => {
  const {
    data: { job },
  } = await axios.post(`/api/survey/${surveyId}/records/validate`, { surveyId })
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

// ==== Validation Report
export const startValidationReportGeneration = async ({ surveyId, cycle, recordUuid, lang }) => {
  const { data } = await axios.post(`/api/survey/${surveyId}/validationReport/start-export`, {
    cycle,
    recordUuid,
    lang,
  })
  return data
}

export const getValidationReportDownloadUrl = ({ surveyId, tempFileName }) =>
  `${window.location.origin}/api/survey/${surveyId}/validationReport/download?${new URLSearchParams({ tempFileName })}`
