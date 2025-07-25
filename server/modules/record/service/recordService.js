import * as fs from 'fs'

import { NodeValues, Objects } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as A from '@core/arena'
import * as Authorizer from '@core/auth/authorizer'
import * as DateUtils from '@core/dateUtils'
import * as PromiseUtils from '@core/promiseUtils'
import * as Node from '@core/record/node'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import * as Record from '@core/record/record'
import * as RecordFile from '@core/record/recordFile'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as JobManager from '@server/job/jobManager'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as Response from '@server/utils/response'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'
import * as FileService from './fileService'

import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'
import { NodesDeleteBatchPersister } from '../manager/NodesDeleteBatchPersister'
import { NodesInsertBatchPersister } from '../manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '../manager/NodesUpdateBatchPersister'
import RecordsCloneJob from './recordsCloneJob'
import SelectedRecordsExportJob from './selectedRecordsExportJob'
import { RecordsUpdateThreadService } from './update/surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from './update/thread/recordsThreadMessageTypes'
import VaidationReportGenerationJob from './validationReportGenerationJob'

const Logger = Log.getLogger('RecordService')

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

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
  updateRecordOwner,
} = RecordManager

export const exportRecordsSummary = async ({ res, surveyId, cycle, fileFormat }) => {
  const { list, nodeDefKeys } = await RecordManager.fetchRecordsSummaryBySurveyId({
    surveyId,
    cycle,
    includeCounts: true,
  })

  const valueFormattersByType = {
    [NodeDef.nodeDefType.date]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: DateUtils.formats.datetimeISO,
        formatTo: DateUtils.formats.dateDefault,
      }),
    [NodeDef.nodeDefType.time]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: 'HH:mm:ss',
        formatTo: DateUtils.formats.timeStorage,
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
      files_count: Record.getFilesCount(recordSummary),
      files_size: Record.getFilesSize(recordSummary),
      owner_name: Record.getOwnerName(recordSummary),
      errors: Validation.getErrorsCount(validation),
      warnings: Validation.getWarningsCount(validation),
    }
  }

  const survey = await SurveyManager.fetchSurveyById({ surveyId })
  const fileName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'Records', fileFormat })
  Response.setContentTypeFile({ res, fileName, fileFormat })

  const fields = [
    ...nodeDefKeys.flatMap((nodeDefKey) => NodeDefTable.getColumnNames(nodeDefKey)),
    'data_created',
    'date_modified',
    'files_count',
    'files_size',
    'owner_name',
    'step',
    'errors',
    'warnings',
  ]
  return FlatDataWriter.writeItemsToStream({
    outputStream: res,
    fileFormat,
    items: list,
    fields,
    options: { objectTransformer },
  })
}

// Records export job
export const startRecordsExportJob = ({ user, surveyId, recordUuids }) => {
  const job = new SelectedRecordsExportJob({ user, surveyId, recordUuids })
  JobManager.enqueueJob(job)
  return job
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
  if (recordSummary) {
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
  }
  RecordsUpdateThreadService.dissocSocket({ recordUuid, socketId })
}

export const dissocSocketFromUpdateThread = RecordsUpdateThreadService.dissocSocketBySocketId

// VALIDATION REPORT
export const { fetchValidationReport, countValidationReportItems } = RecordManager

// RECORDS CLONE
export const startRecordsCloneJob = ({ user, surveyId, cycleFrom, cycleTo, recordsUuids }) => {
  const job = new RecordsCloneJob({ user, surveyId, cycleFrom, cycleTo, recordsUuids })
  JobManager.enqueueJob(job)
  return job
}

// Validation Report
export const startValidationReportGenerationJob = ({ user, surveyId, cycle, lang, recordUuid, fileFormat }) => {
  const job = new VaidationReportGenerationJob({ user, surveyId, cycle, lang, recordUuid, fileFormat })
  JobManager.enqueueJob(job)
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
    const fileObj = RecordFile.createFile({
      uuid: Node.getFileUuid(node),
      name: file.name,
      size: file.size,
      content: fs.readFileSync(file.tempFilePath),
      recordUuid,
      nodeUuid: Node.getUuid(node),
    })
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
  const record = await fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid: Node.getRecordUuid(node),
    includeRefData: true,
  })
  const surveySummary = await SurveyManager.fetchSurveyById({ surveyId })
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    draft: !Survey.isPublished(surveySummary),
    advanced: true,
    includeBigCategories: false,
    includeBigTaxonomies: false,
  })
  // return calculatd name (if any)
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.getFileNameExpression(nodeDef)) {
    const calculatedName = NodeValues.getFileNameCalculated(node)
    if (Objects.isNotEmpty(calculatedName)) {
      return calculatedName
    }
  }
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
          const ancestorKeyNodes = Record.getEntityKeyNodes(survey, ancestorNode)(record)
          const keyValuesFormatted = ancestorKeyDefs
            .map((keyDef, index) => {
              const keyNode = ancestorKeyNodes[index]
              const keyValueFormatted = NodeValueFormatter.format({
                survey,
                nodeDef: keyDef,
                node: keyNode,
                value: Node.getValue(keyNode),
              })
              return encodeURIComponent(keyValueFormatted)
            })
            .filter(Objects.isNotEmpty)
          fileNameParts.unshift(keyValuesFormatted.join('_'))
        }
      }
    },
  })(record)

  const fileName = RecordFile.getName(file)
  const extension = FileUtils.getFileExtension(fileName)

  return `file_${surveyName}_${fileNameParts.join('_')}.${extension}`
}
const persistRecordNodes = async ({ user, survey, record, nodesArray }, tx) => {
  const surveyId = Survey.getId(survey)

  const nodesDeleteBatchPersister = new NodesDeleteBatchPersister({ user, surveyId, tx })
  const nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
  const nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })

  if (nodesArray.length === 0) return

  for (const node of nodesArray) {
    if (Node.isDeleted(node)) {
      await nodesDeleteBatchPersister.addItem(node)
    } else if (Node.isCreated(node)) {
      await nodesInsertBatchPersister.addItem(node)
    } else if (Node.isUpdated(node)) {
      await nodesUpdateBatchPersister.addItem(node)
    }
  }
  await nodesDeleteBatchPersister.flush()
  await nodesInsertBatchPersister.flush()
  await nodesUpdateBatchPersister.flush()

  await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)
}

export const mergeRecords = async (
  { user, surveyId, sourceRecordUuid, targetRecordUuid, dryRun = false },
  client = db
) =>
  client.tx(async (tx) => {
    const recordSource = await fetchRecordAndNodesByUuid({ surveyId, recordUuid: sourceRecordUuid }, tx)
    const recordTarget = await fetchRecordAndNodesByUuid({ surveyId, recordUuid: targetRecordUuid }, tx)

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      {
        surveyId,
        advanced: true,
        includeBigCategories: false,
        includeBigTaxonomies: false,
      },
      tx
    )

    const { record: recordTargetUpdated, nodes: nodesUpdated } = await Record.mergeRecords({
      survey,
      recordSource,
      categoryItemProvider,
      taxonProvider,
      sideEffect: true,
    })(recordTarget)

    const nodesArray = Object.values(nodesUpdated)

    if (!dryRun) {
      const logContent = {
        sourceRecordUuid,
        sourceRecordKeys: NodeValueFormatter.getFormattedRecordKeys({ survey, record: recordSource }),
        targetRecordUuid,
        targetRecordKeys: NodeValueFormatter.getFormattedRecordKeys({ survey, record: recordTarget }),
      }
      await ActivityLogService.insert(user, surveyId, ActivityLog.type.recordMerge, logContent, false, tx)

      await persistRecordNodes({ user, survey, record: recordTargetUpdated, nodesArray }, tx)

      await RecordManager.updateRecordMergedInto(
        {
          surveyId,
          recordUuid: sourceRecordUuid,
          mergedIntoRecordUuid: targetRecordUuid,
        },
        tx
      )
      await SurveyRdbManager.deleteRowsByRecordUuid({ survey, recordUuid: sourceRecordUuid }, tx)

      await RecordManager.updateRecordDateModified({ surveyId, recordUuid: targetRecordUuid }, tx)
    }
    return {
      record: recordTargetUpdated,
      nodesCreated: nodesArray.filter(Node.isCreated).length,
      nodesUpdated: nodesArray.filter(Node.isUpdated).length,
    }
  })
