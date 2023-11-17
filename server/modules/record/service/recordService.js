import * as fs from 'fs'

import * as Log from '@server/log/log'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as A from '@core/arena'
import SystemError from '@core/systemError'
import * as PromiseUtils from '@core/promiseUtils'
import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
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
import * as FileUtils from '@server/utils/file/fileUtils'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'
import * as FileService from './fileService'

import { RecordsUpdateThreadMessageTypes } from './update/thread/recordsThreadMessageTypes'
import RecordsCloneJob from './recordsCloneJob'
import { RecordsUpdateThreadService } from './update/surveyRecordsThreadService'

const Logger = Log.getLogger('RecordService')

// RECORD
export const createRecord = async ({ user, surveyId, recordToCreate }) => {
  Logger.debug('creating record: ', recordToCreate)

  return RecordManager.insertRecord(user, surveyId, recordToCreate)
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
  fetchRecordCreatedCountsByDatesAndUser,
  fetchRecordCreatedCountsByUser,
  fetchRecordCountsByStep,
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
      ...nodeDefKeys.reduce((keysAcc, nodeDefKey) => {
        const nodeDefKeyColumnNames = NodeDefTable.getColumnNames(nodeDefKey)
        nodeDefKeyColumnNames.forEach((nodeDefKeyColumnName) => {
          const value = recordSummary[A.camelize(nodeDefKeyColumnName)]
          const formatter = valueFormattersByType[NodeDef.getType(nodeDefKey)]
          const valueFormatted = formatter ? formatter({ value }) : value
          keysAcc[nodeDefKeyColumnName] = valueFormatted
        })
        return keysAcc
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
    ...nodeDefKeys.flatMap((nodeDefKey) => NodeDefTable.getColumnNames(nodeDefKey)),
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
  const cycle = Record.getCycle(record)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  await RecordManager.deleteRecord(user, survey, record)

  RecordsUpdateThreadService.notifyRecordDeleteToSockets({ socketIdUser: socketId, recordUuid, notifySameUser })
  RecordsUpdateThreadService.clearRecordDataFromThread({ surveyId, cycle, draft: false, recordUuid })
}

export const deleteRecords = async ({ socketId, user, surveyId, recordUuids }) => {
  Logger.debug('deleting records - surveyId:', surveyId, 'recordUuids:', recordUuids)

  await PromiseUtils.each(recordUuids, async (recordUuid) => {
    await deleteRecord({ socketId, user, surveyId, recordUuid })
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

export const checkIn = async ({ socketId, user, surveyId, recordUuid, draft, timezoneOffset }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, draft })
  const preview = Record.isPreview(record)
  const cycle = Record.getCycle(record)

  RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })

  if (preview || (Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record))) {
    // Create record thread
    const thread = RecordsUpdateThreadService.getOrCreatedThread()
    // initialize record if empty
    if (Record.getNodesArray(record).length === 0) {
      thread.postMessage({
        type: RecordsUpdateThreadMessageTypes.recordInit,
        user,
        surveyId,
        cycle,
        draft,
        recordUuid,
        timezoneOffset,
      })
    }
  }
  return record
}

export const checkOut = async (socketId, user, surveyId, recordUuid) => {
  const recordSummary = await RecordManager.fetchRecordSummary({
    surveyId,
    recordUuid,
    includeRootKeyValues: false,
    includePreview: true,
  })
  const cycle = Record.getCycle(recordSummary)

  if (Record.isPreview(recordSummary)) {
    RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId, cycle, draft: true })
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  } else {
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, fetchForUpdate: false })
    if (Record.isEmpty(record)) {
      await deleteRecord({ socketId, user, surveyId, recordUuid, notifySameUser: true })
    }
  }
  RecordsUpdateThreadService.dissocSocket({ recordUuid, socketId })
}

export const dissocSocketFromUpdateThread = RecordsUpdateThreadService.dissocSocketBySocketId

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

// RECORDS CLONE
export const startRecordsCloneJob = ({ user, surveyId, cycleFrom, cycleTo, recordsUuids }) => {
  const job = new RecordsCloneJob({ user, surveyId, cycleFrom, cycleTo, recordsUuids })
  JobManager.executeJobThread(job)
  return job
}

// NODE
const _sendNodeUpdateMessage = ({ socketId, user, recordUuid, msg }) => {
  RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })

  const thread = RecordsUpdateThreadService.getOrCreatedThread()
  thread.postMessage(msg, user)
}

export const { fetchNodeByUuid } = RecordManager

export const persistNode = async ({
  socketId,
  user,
  surveyId,
  draft,
  cycle,
  node,
  file = null,
  timezoneOffset = null,
}) => {
  const recordUuid = Node.getRecordUuid(node)

  if (file) {
    const filesStatistics = await FileService.fetchFilesStatistics({ surveyId })
    if (filesStatistics.availableSpace < file.size) {
      throw new SystemError('cannotInsertFileExceedingQuota') // do not provide details about available quota to the user
    }
    // Save file to "file" table and set fileUuid and fileName into node value
    const fileObj = RecordFile.createFile(
      Node.getFileUuid(node),
      file.name,
      file.size,
      fs.readFileSync(file.tempFilePath),
      recordUuid,
      Node.getUuid(node)
    )
    await FileService.insertFile(surveyId, fileObj)
  }

  _sendNodeUpdateMessage({
    socketId,
    user,
    recordUuid,
    msg: {
      type: RecordsUpdateThreadMessageTypes.nodePersist,
      surveyId,
      cycle,
      draft,
      node,
      user,
      timezoneOffset,
    },
  })
}

export const deleteNode = ({ socketId, user, surveyId, cycle, draft, recordUuid, nodeUuid, timezoneOffset }) =>
  _sendNodeUpdateMessage({
    socketId,
    user,
    recordUuid,
    msg: {
      type: RecordsUpdateThreadMessageTypes.nodeDelete,
      surveyId,
      cycle,
      draft,
      recordUuid,
      nodeUuid,
      user,
      timezoneOffset,
    },
  })

// generates the record file name in this format: file_SURVEYNAME_KEYVALUES_ATTRIBUTENAME_POSITION.EXTENSION
export const generateNodeFileNameForDownload = async ({ surveyId, nodeUuid, file }) => {
  const node = await fetchNodeByUuid(surveyId, nodeUuid)
  const record = await fetchRecordAndNodesByUuid({ surveyId, recordUuid: Node.getRecordUuid(node) })
  const surveySummary = await SurveyManager.fetchSurveyById({ surveyId })
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    draft: !Survey.isPublished(surveySummary),
  })
  const surveyName = Survey.getName(Survey.getSurveyInfo(survey))

  const fileNameParts = []
  Record.visitAncestorsAndSelf({
    node,
    visitor: (ancestorNode) => {
      const ancestorDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(ancestorNode))(survey)
      if (ancestorNode === node) {
        fileNameParts.push(NodeDef.getName(ancestorDef))
        if (NodeDef.isMultiple(ancestorDef)) {
          // add node position to the end
          const index = Record.getNodeChildIndex(ancestorNode)(record)
          const position = String(index + 1)
          fileNameParts.push(position)
        }
      } else {
        const ancestorKeyDefs = Survey.getNodeDefKeys(ancestorDef)(survey)

        if (ancestorKeyDefs.length > 0) {
          const ancestorKeyValues = Record.getEntityKeyValues(survey, ancestorNode)(record)
          const keyValuesFormatted = ancestorKeyDefs.map((keyDef, index) => {
            const keyValue = ancestorKeyValues[index]
            const keyValueFormatted = NodeValueFormatter.format({ survey, nodeDef: keyDef, value: keyValue })
            return keyValueFormatted
          })
          fileNameParts.unshift(keyValuesFormatted.join('_'))
        }
      }
    },
  })(record)

  const fileName = RecordFile.getName(file)
  const extension = FileUtils.getFileExtension(fileName)

  return `file_${surveyName}_${fileNameParts.join('_')}.${extension}`
}
