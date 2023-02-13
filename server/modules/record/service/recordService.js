import * as fs from 'fs'

import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as A from '@core/arena'
import * as PromiseUtils from '@core/promiseUtils'
import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as RecordFile from '@core/record/recordFile'
import * as Authorizer from '@core/auth/authorizer'
import * as ValidationResult from '@core/validation/validationResult'
import i18n from '@core/i18n/i18nFactory'
import * as Validation from '@core/validation/validation'
import { ValidationUtils } from '@core/validation/validationUtils'

import * as JobManager from '@server/job/jobManager'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportJob from '@server/modules/dataImport/service/DataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as Response from '@server/utils/response'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'
import * as FileManager from '../manager/fileManager'

import * as RecordServiceThreads from './update/recordServiceThreads'
import { messageTypes as RecordThreadMessageTypes } from './update/thread/recordThreadMessageTypes'

const Logger = Log.getLogger('RecordService')

// RECORD
export const createRecord = async (socketId, user, surveyId, recordToCreate) => {
  Logger.debug('create record: ', recordToCreate)

  const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

  // Create record thread and initialize record
  const thread = RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, Record.getUuid(recordToCreate))
  thread.postMessage({ type: RecordThreadMessageTypes.recordInit })

  return record
}

export const createRecordFromSamplingPointDataItem = async ({ user, surveyId, cycle, itemUuid }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true })
  return RecordManager.createRecordFromSamplingPointDataItem({
    user,
    survey,
    cycle: cycle || Survey.getDefaultCycleKey(survey),
    itemUuid,
  })
}

export const {
  countRecordsBySurveyIdGroupedByStep,
  fetchRecordsUuidAndCycle,
  fetchRecordByUuid,
  fetchRecordsByUuids,
  fetchRecordAndNodesByUuid,
  countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchRecordCreatedCountsByDates,
  updateRecordsStep,
} = RecordManager

export const exportRecordsSummaryToCsv = async ({ res, surveyId, cycle }) => {
  const { list, nodeDefKeys } = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle })

  const valueFormattersByType = {
    [NodeDef.nodeDefType.date]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: DateUtils.formats.datetimeISO,
        formatTo: DateUtils.formats.dateDefault,
      }),
  }

  const objectTransformer = (recordSummary) => {
    const validation = Validation.getValidation(recordSummary)
    return {
      step: Record.getStep(recordSummary),
      ...nodeDefKeys.reduce((keysAcc, nodeDef) => {
        const name = NodeDef.getName(nodeDef)
        const value = recordSummary[A.camelize(name)]
        const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
        return { ...keysAcc, [name]: value && formatter ? formatter({ value }) : value }
      }, {}),
      data_created: DateUtils.formatDateTimeExport(Record.getDateCreated(recordSummary)),
      date_modified: DateUtils.formatDateTimeExport(Record.getDateModified(recordSummary)),
      owner_name: Record.getOwnerName(recordSummary),
      errors: Validation.getErrorsCount(validation),
      warnings: Validation.getWarningsCount(validation),
    }
  }

  const survey = await SurveyManager.fetchSurveyById({ surveyId })
  const fileName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'Records' })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  const fields = [
    ...nodeDefKeys.map(NodeDef.getName),
    'step',
    'owner_name',
    'data_created',
    'date_modified',
    'errors',
    'warnings',
  ]
  return CSVWriter.writeItemsToStream({ outputStream: res, items: list, fields, options: { objectTransformer } })
}

export const updateRecordStep = async (user, surveyId, recordUuid, stepId) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)
  return await RecordManager.updateRecordStepInTransaction({ user, surveyId, record, stepId })
}

export const deleteRecord = async ({ socketId, user, surveyId, recordUuid, notifySameUser = false }) => {
  Logger.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle: Record.getCycle(record) })
  await RecordManager.deleteRecord(user, survey, record)

  // Notify other users viewing or editing the record it has been deleted
  const socketIds = RecordServiceThreads.getSocketIds(recordUuid)
  socketIds.forEach((socketIdCurrent) => {
    if (socketIdCurrent !== socketId || notifySameUser) {
      WebSocketServer.notifySocket(socketIdCurrent, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  RecordServiceThreads.dissocSocketsByRecordUuid(recordUuid)
}

export const deleteRecords = async ({ user, surveyId, recordUuids }) => {
  Logger.debug('deleting records - surveyId:', surveyId, 'recordUuids:', recordUuids)

  await PromiseUtils.each(recordUuids, async (recordUuid) => {
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle: Record.getCycle(record) })
    await RecordManager.deleteRecord(user, survey, record)
  })

  Logger.debug('records deleted - surveyId:', surveyId, 'recordUuids:', recordUuids)
}

export const deleteRecordsPreview = async (olderThan24Hours = false) => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  let count = 0
  await PromiseUtils.each(surveyIds, async (surveyId) => {
    const deletedRecordsCount = await RecordManager.deleteRecordsPreview(surveyId, olderThan24Hours)
    count += deletedRecordsCount
  })
  return count
}

export const checkIn = async (socketId, user, surveyId, recordUuid, draft) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, draft })
  const preview = Record.isPreview(record)

  if (preview || (Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record))) {
    RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, recordUuid)
  }

  RecordServiceThreads.assocSocket(recordUuid, socketId)

  return record
}

export const checkOut = async (socketId, user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, fetchForUpdate: false })

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  } else if (Record.isEmpty(record)) {
    await deleteRecord({ socketId, user, surveyId, recordUuid, notifySameUser: true })
  }
  RecordServiceThreads.dissocSocket(socketId)
}

export const dissocSocketFromRecordThread = RecordServiceThreads.dissocSocket

// VALIDATION REPORT
export const { fetchValidationReport, countValidationReportItems } = RecordManager

export const exportValidationReportToCSV = async ({ res, surveyId, cycle, lang, recordUuid = null }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const fileName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'ValidationReport' })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  const objectTransformer = (item) => {
    const path = RecordValidationReportItem.getPath({ survey, lang, labelType: NodeDef.NodeDefLabelTypes.name })(item)
    const validation = RecordValidationReportItem.getValidation(item)

    const errors = ValidationUtils.getJointMessage({
      i18n,
      survey,
      showKeys: false,
      severity: ValidationResult.severity.error,
    })(validation)

    const warnings = ValidationUtils.getJointMessage({
      i18n,
      survey,
      showKeys: false,
      severity: ValidationResult.severity.warning,
    })(validation)

    return {
      path,
      errors,
      warnings,
      record_step: RecordValidationReportItem.getRecordStep(item),
      record_cycle: Number(RecordValidationReportItem.getRecordCycle(item)) + 1,
      record_owner_name: RecordValidationReportItem.getRecordOwnerName(item),
      record_date_created: DateUtils.formatDateTimeExport(RecordValidationReportItem.getRecordDateCreated(item)),
      record_date_modified: DateUtils.formatDateTimeExport(RecordValidationReportItem.getRecordDateModified(item)),
    }
  }
  const headers = [
    'path',
    'errors',
    'warnings',
    'record_step',
    'record_cycle',
    'record_owner_name',
    'record_date_created',
    'record_date_modified',
  ]
  const streamTransformer = CSVWriter.transformJsonToCsv({ fields: headers, options: { objectTransformer } })
  streamTransformer.pipe(res)

  await RecordManager.exportValidationReportToStream({ streamTransformer, surveyId, cycle, recordUuid })
}

// DATA IMPORT
export const startCollectDataImportJob = ({ user, surveyId, filePath, deleteAllRecords, cycle, forceImport }) => {
  const job = new CollectDataImportJob({
    user,
    surveyId,
    filePath,
    deleteAllRecords,
    cycle,
    forceImport,
  })
  JobManager.executeJobThread(job)
  return job
}

export const startCSVDataImportJob = ({
  user,
  surveyId,
  filePath,
  cycle,
  entityDefUuid,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  abortOnErrors = true,
}) => {
  const jobParams = {
    user,
    surveyId,
    filePath,
    cycle,
    entityDefUuid,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    abortOnErrors,
  }
  const job = dryRun ? new DataImportValidationJob(jobParams) : new DataImportJob(jobParams)
  JobManager.executeJobThread(job)
  return job
}

// NODE
const _sendNodeUpdateMessage = (socketId, user, surveyId, recordUuid, msg) => {
  RecordServiceThreads.assocSocket(recordUuid, socketId)

  const singleMessage = !RecordServiceThreads.getRecordThread(recordUuid)

  const thread = RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, recordUuid)
  thread.postMessage(msg, user)

  if (singleMessage) {
    RecordServiceThreads.killRecordThread(recordUuid)
  }
}

export const { fetchNodeByUuid } = RecordManager

export const persistNode = async (socketId, user, surveyId, node, file) => {
  const recordUuid = Node.getRecordUuid(node)

  if (file) {
    // Save file to "file" table and set fileUuid and fileName into node value
    const fileObj = RecordFile.createFile(
      Node.getFileUuid(node),
      file.name,
      file.size,
      fs.readFileSync(file.tempFilePath),
      recordUuid,
      Node.getUuid(node)
    )
    await FileManager.insertFile(surveyId, fileObj)
  }

  _sendNodeUpdateMessage(socketId, user, surveyId, recordUuid, {
    type: RecordThreadMessageTypes.nodePersist,
    node,
    user,
  })
}

export const deleteNode = (socketId, user, surveyId, recordUuid, nodeUuid) =>
  _sendNodeUpdateMessage(socketId, user, surveyId, recordUuid, {
    type: RecordThreadMessageTypes.nodeDelete,
    nodeUuid,
    user,
  })
