import type { Response as ExpressResponse } from 'express'
import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'

import {
  ArenaAnyNodeDef,
  type ArenaRecord,
  type ArenaRecordNode,
  type ArenaSurvey,
  type ArenaSurveyDocImage,
  type ArenaUser,
  Authorizer,
  Objects,
  RecordExpressionEvaluator,
  RecordNodeValues,
  Records,
  SurveyDocImages,
  SurveyDocPlace,
} from '@openforis/arena-core'
import { SurveyDocxGenerator, type SurveyDocxOptions, SurveyPdfGenerator } from '@openforis/arena-server'

import * as ActivityLog from '@common/activityLog/activityLog'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { Query } from '@common/model/query'
import {
  type PrintableExportScope,
  PrintableExportScopes,
  type PrintOrientation,
  PrintOrientations,
} from '@common/record/printableExport'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import { AppInfo } from '@core/app/appInfo'
import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'
import * as Node from '@core/record/node'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Validation from '@core/validation/validation'
import { db, DbClient } from '@server/db/db'
import * as JobManager from '@server/job/jobManager'
import * as Log from '@server/log/log'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'
import { createRecordEvaluationContext } from '@server/modules/record/manager/recordEvaluationContextDefault'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import type { UploadedFile } from '@server/utils/file/uploadedFile'
import * as Response from '@server/utils/response'
import * as SurveyManager from '../../survey/manager/surveyManager'
import { findSurveyDocImageApplicable } from '../../survey/service/surveyDocImageUtils'
import { NodesDeleteBatchPersister } from '../manager/nodesDeleteBatchPersister'
import { NodesInsertBatchPersister } from '../manager/nodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '../manager/nodesUpdateBatchPersister'
import * as RecordFileManager from '../manager/recordFileManager'
import * as RecordManager from '../manager/recordManager'
import * as ShareRepository from '../repository/recordPrintableExportShareRepository'

import { toQrPngBuffer } from './qrCodePng'
import { upsertShareWithPdf } from './recordPrintableExportShareService'
import RecordsCloneJob from './recordsCloneJob'
import RecordsValidationJob from './recordsValidationJob'
import SelectedRecordsExportJob from './selectedRecordsExportJob'
import { RecordsUpdateThreadService } from './update/surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from './update/thread/recordsThreadMessageTypes'
import VaidationReportGenerationJob from './validationReportGenerationJob'
import { resolveValidationReportParams } from './validationReportParams'

type PrintableDocumentGenerator = (options: SurveyDocxOptions) => Promise<{ buffer: Buffer; surveyName: string }>

const Logger = Log.getLogger('RecordService')

// The socket-to-record association is only delivery bookkeeping ("which sockets should be notified
// about updates to this record"): it must never make the record read/write it's attached to fail.
// It is DB-backed (socket_id is NOT NULL and a FK to connected_socket), so a missing socket id
// (e.g. a request sent while the client WebSocket is reconnecting) or an already-disconnected one
// would otherwise throw where the previous in-memory implementation silently tolerated it.
const _assocSocketBestEffort = async ({ recordUuid, socketId }: { recordUuid: string; socketId: string }) => {
  if (!socketId) return
  try {
    await RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })
  } catch (error) {
    Logger.warn(`could not associate socket ${socketId} to record ${recordUuid}: ${error}`)
  }
}

const _dissocSocketBestEffort = async ({ recordUuid, socketId }: { recordUuid: string; socketId: string }) => {
  if (!socketId) return
  try {
    await RecordsUpdateThreadService.dissocSocket({ recordUuid, socketId })
  } catch (error) {
    Logger.warn(`could not dissociate socket ${socketId} from record ${recordUuid}: ${error}`)
  }
}

// RECORD
// preview records are allowed to survey editors or, when enabled in the (published) survey, to data entry users
export const canCreateRecordPreview = async ({ user, surveyId }: { user: ArenaUser; surveyId: number }) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById({ surveyId }))
  return (
    Authorizer.canEditSurvey(user, surveyInfo) ||
    (Survey.isFormPreviewForDataEntryUsers(surveyInfo) && Authorizer.canCreateRecord(user, surveyInfo))
  )
}

export const createRecord = ({
  user,
  surveyId,
  recordToCreate,
}: {
  user: ArenaUser
  surveyId: number
  recordToCreate: ArenaRecord
}) => {
  Logger.debug('creating record: ', recordToCreate)

  return RecordManager.insertRecord(user, surveyId, recordToCreate)
}

export const createRecordFromSamplingPointDataItem = async ({
  user,
  surveyId,
  cycle,
  itemUuid,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  itemUuid: string
}) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true })
  return RecordManager.createRecordFromSamplingPointDataItem({
    user,
    survey,
    cycle: cycle || Survey.getDefaultCycleKey(survey),
    itemUuid,
  })
}

/**
 * Fetches, for each of the given record UUIDs, the UUIDs of the files already stored on the
 * server for it. Used by mobile clients to skip re-uploading file content that hasn't changed.
 * @param {object} params - The function parameters.
 * @param {number} params.surveyId - The survey ID.
 * @param {Array<string>} params.recordUuids - The record UUIDs to fetch files for.
 * @returns {Promise<{[recordUuid: string]: Array<string>}>} File UUIDs grouped by record UUID.
 */
export const fetchFileUuidsByRecordUuid = async ({
  surveyId,
  recordUuids,
}: {
  surveyId: number
  recordUuids: string[]
}) => {
  const files = await RecordFileManager.fetchNonDeletedFileUuidsByRecordUuids({ surveyId, recordUuids })
  const fileUuidsByRecordUuid = {}
  for (const { fileUuid, recordUuid } of files) {
    if (!fileUuidsByRecordUuid[recordUuid]) {
      fileUuidsByRecordUuid[recordUuid] = []
    }
    fileUuidsByRecordUuid[recordUuid].push(fileUuid)
  }
  return fileUuidsByRecordUuid
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

// keepTimeZone: false avoids convertDate's default parseZone-based parsing, which treats a
// timezone-less "HH:mm:ss" string as UTC and shifts it by the local UTC offset on format (e.g.
// "14:30:45" -> "16:30:45" on a UTC+2 host). Time values have no timezone component, so they
// must be parsed and formatted consistently in the local zone.
/**
 * Formats a time value for display in the records summary, applying the node definition's time format.
 * @param {object} params - The function parameters.
 * @param {string} params.value - The stored time value (HH:mm:ss).
 * @param {object} params.nodeDef - The time node definition the value belongs to.
 * @returns {string} The formatted time value.
 */
export const formatTimeSummaryValue = ({ value, nodeDef }: { value: string; nodeDef: ArenaAnyNodeDef }) =>
  DateUtils.convertDate({
    dateStr: value,
    formatFrom: DateUtils.formats.timeWithSeconds,
    formatTo: DateUtils.getTimeFormat(NodeDef.isSecondsIncluded(nodeDef)),
    keepTimeZone: false,
  })

export const exportRecordsSummary = async ({
  res,
  surveyId,
  cycle,
  fileFormat,
  ownerUuid = null,
  user,
}: {
  res: ExpressResponse
  surveyId: number
  cycle: string
  fileFormat: string
  ownerUuid?: string
  user: ArenaUser
}) => {
  const { list, nodeDefKeys } = await RecordManager.fetchRecordsSummaryBySurveyId({
    surveyId,
    cycle,
    includeCounts: true,
    ownerUuid,
    user,
  })

  const valueFormattersByType = {
    [NodeDef.nodeDefType.date]: ({ value }) =>
      DateUtils.convertDate({
        dateStr: value,
        formatFrom: DateUtils.formats.datetimeISO,
        formatTo: DateUtils.formats.dateDefault,
      }),
    [NodeDef.nodeDefType.time]: formatTimeSummaryValue,
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
          const valueFormatted = formatter ? formatter({ value, nodeDef: nodeDefKey }) : value
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
export const startRecordsExportJob = ({
  user,
  surveyId,
  recordUuids,
  excludedFileUuids = [],
}: {
  user: ArenaUser
  surveyId: number
  recordUuids: string[]
  excludedFileUuids?: string[]
}) => {
  const job = new SelectedRecordsExportJob({ user, surveyId, recordUuids, excludedFileUuids })
  JobManager.enqueueJob(job)
  return job
}

export const updateRecordStep = async (user: ArenaUser, surveyId: number, recordUuid: string, stepId: string) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)
  return await RecordManager.updateRecordStepInTransaction({ user, surveyId, record, stepId })
}

export const deleteRecord = async ({
  socketId,
  user,
  surveyId,
  recordUuid,
  notifySameUser = false,
}: {
  socketId: string
  user: ArenaUser
  surveyId: number
  recordUuid: string
  notifySameUser?: boolean
}) => {
  Logger.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
  const cycle = Record.getCycle(record)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  await RecordManager.deleteRecord(user, survey, record)

  await RecordsUpdateThreadService.notifyRecordDeleteToSockets({ socketIdUser: socketId, recordUuid, notifySameUser })
  RecordsUpdateThreadService.clearRecordDataFromThread({ surveyId, cycle, draft: false, recordUuid })
}

export const deleteRecords = async ({
  socketId,
  user,
  surveyId,
  recordUuids,
}: {
  socketId: string
  user: ArenaUser
  surveyId: number
  recordUuids: string[]
}) => {
  Logger.debug('deleting records - surveyId:', surveyId, 'recordUuids:', recordUuids)

  for (const recordUuid of recordUuids) {
    await deleteRecord({ socketId, user, surveyId, recordUuid }) // NOSONAR
  }

  Logger.debug('records deleted - surveyId:', surveyId, 'recordUuids:', recordUuids)
}

export const deleteRecordsPreview = async (olderThan24Hours = false) => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  let count = 0
  for (const surveyId of surveyIds) {
    const deletedRecordsCount = await RecordManager.deleteRecordsPreview(surveyId, olderThan24Hours) // NOSONAR
    count += deletedRecordsCount
  }
  return count
}

const _recordMatchesUserGroupQualifiers = async ({
  user,
  surveyId,
  cycle,
  draft,
  record,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  draft: boolean
  record: ArenaRecord
}) => {
  const surveyWithDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft })
  const qualifierFilters = await SurveyManager.fetchUserQualifierFilters({ user, survey: surveyWithDefs })
  return RecordManager.recordMatchesQualifierFilters({ survey: surveyWithDefs, record, qualifierFilters })
}

export const checkIn = async ({
  socketId,
  user,
  surveyId,
  recordUuid,
  draft,
  timezoneOffset,
  lang,
}: {
  socketId: string
  user: ArenaUser
  surveyId: number
  recordUuid: string
  draft: boolean
  timezoneOffset: number
  lang: string
}) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const surveyInfo = Survey.getSurveyInfo(survey)
  // Passing `user` re-evaluates user-dependent applicability/relevance (e.g. userProp) for
  // the current viewer/editor in memory, without persisting it - see RecordManager.fetchRecordAndNodesByUuid.
  // This happens regardless of edit permission: existing persisted records - even when only
  // viewed, not edited - must reflect visibility for the current viewer, not whoever last edited them.
  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, draft, user })
  const preview = Record.isPreview(record)
  const cycle = Record.getCycle(record)
  const nodesEmpty = Record.getNodesArray(record).length === 0

  await _assocSocketBestEffort({ recordUuid, socketId })

  // records of the groups the user's group can only read (see UserGroup readableGroupUuids)
  const readOnly = !preview && !(await _recordMatchesUserGroupQualifiers({ user, surveyId, cycle, draft, record }))

  if (preview || (Survey.isPublished(surveyInfo) && !readOnly && Authorizer.canEditRecord(user, record))) {
    // Create record thread
    const thread = RecordsUpdateThreadService.getOrCreatedThread()
    // initialize record if empty, otherwise evaluate again the app info dependent expressions (if the app changed)
    if (nodesEmpty || Records.isAppInfoChanged(AppInfo.currentAppInfo)(record)) {
      thread.postMessage({
        type: nodesEmpty
          ? RecordsUpdateThreadMessageTypes.recordInit
          : RecordsUpdateThreadMessageTypes.recordAppInfoUpdate,
        user,
        surveyId,
        cycle,
        draft,
        recordUuid,
        timezoneOffset,
        lang,
      })
    }
  }

  return readOnly ? Record.assocReadOnly(true)(record) : record
}

export const checkOut = async (socketId: string, user: ArenaUser, surveyId: number, recordUuid: string) => {
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
  await _dissocSocketBestEffort({ recordUuid, socketId })
}

export const dissocSocketFromUpdateThread = RecordsUpdateThreadService.dissocSocketBySocketId

// VALIDATION REPORT
export const fetchValidationReport = async ({
  user,
  surveyId,
  cycle,
  offset,
  limit,
  recordUuid,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
  sortBy,
  sortOrder,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  offset: number
  limit: number | null
  recordUuid: string
  query: Query.QueryItem | null
  attributeDefUuids?: string[]
  messageTypeKeys?: string[] | null
  sortBy: string | null
  sortOrder: string | null
}) => {
  const { rootDataViewName, filterBySurveyAttrs, recordAccessFilters } = await resolveValidationReportParams({
    user,
    surveyId,
    cycle,
    query,
    attributeDefUuids,
    messageTypeKeys,
  })
  return RecordManager.fetchValidationReport({
    surveyId,
    cycle,
    offset,
    limit,
    recordUuid,
    rootDataViewName,
    filterBySurveyAttrs,
    recordAccessFilters,
    sortBy,
    sortOrder,
  })
}

export const countValidationReportItems = async ({
  user,
  surveyId,
  cycle,
  recordUuid,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  recordUuid: string
  query: Query.QueryItem | null
  attributeDefUuids?: string[]
  messageTypeKeys?: string[] | null
}) => {
  const { rootDataViewName, filterBySurveyAttrs, recordAccessFilters } = await resolveValidationReportParams({
    user,
    surveyId,
    cycle,
    query,
    attributeDefUuids,
    messageTypeKeys,
  })
  return RecordManager.countValidationReportItems({
    surveyId,
    cycle,
    recordUuid,
    rootDataViewName,
    filterBySurveyAttrs,
    recordAccessFilters,
  })
}

// RECORDS CLONE
export const startRecordsCloneJob = ({
  user,
  surveyId,
  cycleFrom,
  cycleTo,
  recordsUuids,
}: {
  user: ArenaUser
  surveyId: number
  cycleFrom: string
  cycleTo: string
  recordsUuids: string[]
}) => {
  const job = new RecordsCloneJob({ user, surveyId, cycleFrom, cycleTo, recordsUuids })
  JobManager.enqueueJob(job)
  return job
}

// Validation Report
export const startValidationReportGenerationJob = ({
  user,
  surveyId,
  cycle,
  lang,
  recordUuid,
  query,
  attributeDefUuids,
  messageTypeKeys,
  fileFormat,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  lang: string
  recordUuid: string
  query: Query.QueryItem | null
  attributeDefUuids: string[]
  messageTypeKeys: string[] | null
  fileFormat: string
}) => {
  const job = new VaidationReportGenerationJob({
    user,
    surveyId,
    cycle,
    lang,
    recordUuid,
    query,
    attributeDefUuids,
    messageTypeKeys,
    fileFormat,
  })
  JobManager.enqueueJob(job)
  return job
}

export const startRecordsValidationJob = ({ user, surveyId }: { user: ArenaUser; surveyId: number }) => {
  const job = new RecordsValidationJob({ user, surveyId })
  JobManager.enqueueJob(job)
  return job
}

// NODE
const _sendNodeUpdateMessage = async ({
  socketId,
  recordUuid,
  msg,
}: {
  socketId: string
  recordUuid: string
  msg: { [key: string]: unknown }
}) => {
  await _assocSocketBestEffort({ recordUuid, socketId })

  const thread = RecordsUpdateThreadService.getOrCreatedThread()
  thread.postMessage(msg)
}

export const { fetchNodeByUuid } = RecordManager
export { updateNodesBatch } from './update/nodesBatch/nodesBatchService'

export const persistNode = async ({
  socketId,
  user,
  surveyId,
  draft,
  cycle,
  node,
  file = null,
  timezoneOffset = null,
  lang = null,
  clearNonApplicableValuesConfirmed = false,
}: {
  socketId: string
  user: ArenaUser
  surveyId: number
  draft: boolean
  cycle: string
  node: ArenaRecordNode
  file?: UploadedFile
  timezoneOffset?: number
  lang?: string
  clearNonApplicableValuesConfirmed?: boolean
}) => {
  const recordUuid = Node.getRecordUuid(node)

  if (file) {
    const filesStatistics = await SurveyFileService.fetchFilesStatistics({ surveyId })
    if (filesStatistics.availableSpace < file.size) {
      throw new SystemError('cannotInsertFileExceedingQuota') // do not provide details about available quota to the user
    }
    // Save file to "file" table and set fileUuid and fileName into node value
    const fileObj = SurveyFile.createFile({
      uuid: Node.getFileUuid(node),
      name: file.name,
      size: file.size,
      content: fs.readFileSync(file.tempFilePath),
      recordUuid,
      nodeUuid: Node.getUuid(node),
      type: SurveyFile.SurveyFileType.recordAttachment,
    })
    await SurveyFileService.insertFile(surveyId, fileObj)
  }

  await _sendNodeUpdateMessage({
    socketId,
    recordUuid,
    msg: {
      type: RecordsUpdateThreadMessageTypes.nodePersist,
      surveyId,
      cycle,
      draft,
      node,
      user,
      timezoneOffset,
      lang,
      socketId,
      clearNonApplicableValuesConfirmed,
    },
  })
}

export const deleteNode = ({
  socketId,
  user,
  surveyId,
  cycle,
  draft,
  recordUuid,
  nodeUuid,
  timezoneOffset,
  lang,
  clearNonApplicableValuesConfirmed = false,
}: {
  socketId: string
  user: ArenaUser
  surveyId: number
  cycle: string
  draft: boolean
  recordUuid: string
  nodeUuid: string
  timezoneOffset: number
  lang: string
  clearNonApplicableValuesConfirmed?: boolean
}) =>
  _sendNodeUpdateMessage({
    socketId,
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
      lang,
      socketId,
      clearNonApplicableValuesConfirmed,
    },
  })

// generates the record file name in this format: file_SURVEYNAME_KEYVALUES_ATTRIBUTENAME_POSITION.EXTENSION
export const generateNodeFileNameForDownload = async ({
  surveyId,
  nodeUuid,
  file,
}: {
  surveyId: number
  nodeUuid: string
  file: SurveyFile.SurveyFile
}) => {
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
    const calculatedName = RecordNodeValues.getFileNameCalculated(node)
    if (Objects.isNotEmpty(calculatedName)) {
      return calculatedName
    }
  }
  const surveyName = Survey.getName(Survey.getSurveyInfo(survey))

  const fileNameParts = []
  Record.visitAncestorsAndSelf(node, (ancestorNode) => {
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
          .filter((part) => Objects.isNotEmpty(part))
        fileNameParts.unshift(keyValuesFormatted.join('_'))
      }
    }
  })(record)

  const fileName = SurveyFile.getName(file)
  const extension = FileUtils.getFileExtension(fileName)

  return `file_${surveyName}_${fileNameParts.join('_')}.${extension}`
}
const persistRecordNodes = async (
  {
    user,
    survey,
    record,
    nodesArray,
  }: { user: ArenaUser; survey: ArenaSurvey; record: ArenaRecord; nodesArray: ArenaRecordNode[] },
  tx: DbClient
) => {
  const surveyId = Survey.getId(survey)
  const isPreview = Record.isPreview(record)

  const nodesDeleteBatchPersister = new NodesDeleteBatchPersister({ user, surveyId, tx })
  const nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
  const nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })

  if (nodesArray.length === 0) return

  // preview records: soft-deleted files are never purged, so hard-delete now the files of any
  // file-type nodes among the ones being deleted (nodesArray already includes every individual
  // descendant node explicitly - Record.updateNodesDependents flattens the whole subtree - so no
  // separate subtree lookup is needed here)
  const fileDeleteParams = []

  for (const node of nodesArray) {
    if (Node.isDeleted(node)) {
      await nodesDeleteBatchPersister.addItem(node) // NOSONAR
      if (isPreview) {
        const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
        if (NodeDef.isFile(nodeDef) && Node.getFileUuid(node)) {
          fileDeleteParams.push({ fileUuid: Node.getFileUuid(node), recordUuid: Node.getRecordUuid(node) })
        }
      }
    } else if (Node.isCreated(node)) {
      await nodesInsertBatchPersister.addItem(node) // NOSONAR
    } else if (Node.isUpdated(node)) {
      await nodesUpdateBatchPersister.addItem(node) // NOSONAR
    }
  }
  await nodesDeleteBatchPersister.flush()
  await nodesInsertBatchPersister.flush()
  await nodesUpdateBatchPersister.flush()

  if (fileDeleteParams.length > 0) {
    await RecordFileManager.deleteFiles({ surveyId, files: fileDeleteParams }, tx)
  }

  await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)
}

export const mergeRecords = (
  {
    user,
    surveyId,
    sourceRecordUuid,
    targetRecordUuid,
    dryRun = false,
  }: { user: ArenaUser; surveyId: number; sourceRecordUuid: string; targetRecordUuid: string; dryRun?: boolean },
  client: DbClient = db
) =>
  client.tx(async (tx) => {
    const recordSource = await fetchRecordAndNodesByUuid({ surveyId, recordUuid: sourceRecordUuid, user }, tx)
    const recordTarget = await fetchRecordAndNodesByUuid({ surveyId, recordUuid: targetRecordUuid, user }, tx)

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, advanced: true, includeBigCategories: false, includeBigTaxonomies: false },
      tx
    )

    const { record: recordTargetUpdated, nodes: nodesUpdated } = await Record.mergeRecords({
      ...createRecordEvaluationContext({ user, survey }),
      recordSource,
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
        { surveyId, recordUuid: sourceRecordUuid, mergedIntoRecordUuid: targetRecordUuid },
        tx
      )
      await SurveyRdbManager.deleteRowsByRecordUuid({ survey, recordUuid: sourceRecordUuid }, tx)

      await RecordManager.updateRecordDateModified({ surveyId, recordUuid: targetRecordUuid }, tx)
    }
    return {
      record: recordTargetUpdated,
      nodesCreated: nodesArray.filter((node) => Node.isCreated(node)).length,
      // updated values: entities can be updated only in their meta or date modified
      nodesUpdated: nodesArray.filter(
        (node) => Node.isUpdated(node) && !NodeDef.isEntity(Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))
      ).length,
    }
  })

const assertCurrentPageEntity = ({
  survey,
  record,
  entityDefUuid,
  entityNodeUuid,
}: {
  survey: ArenaSurvey
  record: ArenaRecord
  entityDefUuid: string
  entityNodeUuid: string
}) => {
  if (!entityDefUuid || !entityNodeUuid) {
    throw new SystemError('appErrors:recordPrintableExport.missingEntityParams', {}, StatusCodes.BAD_REQUEST)
  }
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const entityNode = Record.getNodeByUuid(entityNodeUuid)(record)
  if (!entityDef || !NodeDef.isEntity(entityDef) || !entityNode || Node.getNodeDefUuid(entityNode) !== entityDefUuid) {
    throw new SystemError('appErrors:recordPrintableExport.entityNotFound', {}, StatusCodes.NOT_FOUND)
  }
  return entityDef
}

const generateDocumentWithQrCode = async ({
  surveyId,
  recordUuid,
  entityDefUuid,
  entityNodeUuid,
  serverUrl,
  generatorOptions,
  generator,
  extension,
}: {
  surveyId: number
  recordUuid: string
  entityDefUuid: string
  entityNodeUuid: string
  serverUrl: string
  generatorOptions: SurveyDocxOptions
  generator: PrintableDocumentGenerator
  extension: string
}) => {
  if (!serverUrl) {
    throw new SystemError('appErrors:recordPrintableExport.missingServerUrl', {}, StatusCodes.BAD_REQUEST)
  }

  const existingShare = await ShareRepository.fetchBySurveyRecordEntityNode({
    surveyId,
    recordUuid,
    entityNodeUuid,
  })
  let accessToken = existingShare?.access_token ?? randomBytes(32).toString('base64url')
  let qrCodeImage
  let pdfResult

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const publicUrl = `${serverUrl}/api/public/record-export/${accessToken}`
    qrCodeImage = await toQrPngBuffer(publicUrl) // NOSONAR
    pdfResult = await SurveyPdfGenerator.generateSurveyPdf({ ...generatorOptions, qrCodeImage }) // NOSONAR

    const share = /* NOSONAR */ await upsertShareWithPdf({
      surveyId,
      recordUuid,
      entityDefUuid,
      entityNodeUuid,
      pdfBuffer: pdfResult.buffer,
      accessToken,
    })
    if (share.accessToken === accessToken) {
      return extension === 'pdf' ? pdfResult : await generator({ ...generatorOptions, qrCodeImage }) // NOSONAR
    }
    accessToken = share.accessToken
  }

  throw new SystemError('appErrors:recordPrintableExport.qrTokenMismatch', {}, StatusCodes.CONFLICT)
}

const exportRecordDocument = async ({
  user,
  surveyId,
  recordUuid,
  outputStream,
  lang,
  generator,
  extension,
  contentType,
  exportScope = PrintableExportScopes.full,
  entityDefUuid,
  entityNodeUuid,
  orientation = PrintOrientations.portrait,
  includeQrCode = false,
  serverUrl = null,
}: {
  user: ArenaUser
  surveyId: number
  recordUuid: string
  outputStream: ExpressResponse
  lang: string
  generator: PrintableDocumentGenerator
  extension: string
  contentType: string
  exportScope?: PrintableExportScope
  entityDefUuid: string
  entityNodeUuid: string
  orientation?: PrintOrientation
  includeQrCode?: boolean
  serverUrl?: string
}) => {
  if (includeQrCode && (exportScope !== PrintableExportScopes.currentPage || !entityDefUuid || !entityNodeUuid)) {
    throw new SystemError('appErrors:recordPrintableExport.missingEntityParams', {}, StatusCodes.BAD_REQUEST)
  }

  const record = await fetchRecordAndNodesByUuid({ surveyId, recordUuid, includeRefData: true, user })
  const cycle = Record.getCycle(record)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    includeAnalysis: false,
  })
  const surveyDocImages = Survey.getSurveyDocImages(survey) as ArenaSurveyDocImage[]
  const langToUse = lang ?? Survey.getDefaultLanguage(survey)

  let entityDef = null
  if (exportScope === PrintableExportScopes.currentPage) {
    entityDef = assertCurrentPageEntity({ survey, record, entityDefUuid, entityNodeUuid })
  }

  const rootNode = Record.getRootNode(record)
  const isApplicable = async (imageFile) => {
    const applyIf = SurveyDocImages.getApplyIf(imageFile)
    if (!applyIf) return true
    try {
      const result = await new RecordExpressionEvaluator().evalExpression({
        user,
        survey,
        record,
        node: rootNode,
        query: applyIf,
      })
      return result === true
    } catch {
      return false
    }
  }

  const headerImageFileSummary = await findSurveyDocImageApplicable({
    surveyDocImages,
    documentPlace: SurveyDocPlace.header,
    isApplicable,
  })
  const footerImageFileSummary = await findSurveyDocImageApplicable({
    surveyDocImages,
    documentPlace: SurveyDocPlace.footer,
    isApplicable,
  })

  const headerOnFirstPageOnly = Survey.isDocHeaderOnFirstPageOnly(survey)
  const pageNumbering = Survey.isDocPageNumberingEnabled(survey)

  const i18n = await i18nFactory.createI18nAsync(langToUse)
  const generatorOptions = {
    survey,
    cycle,
    record,
    lang: langToUse,
    i18n,
    fileProvider: async (fileUuid) => {
      const fileSummary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid)
      return SurveyFileService.fetchFileContentAsBuffer({ surveyId, fileSummary })
    },
    headerImageFileUuid: headerImageFileSummary?.uuid,
    footerImageFileUuid: footerImageFileSummary?.uuid,
    headerOnFirstPageOnly,
    pageNumbering,
    readOnly: true,
    exportScope,
    entityDefUuid,
    entityNodeUuid,
    orientation,
  }

  const documentResult = includeQrCode
    ? await generateDocumentWithQrCode({
        surveyId,
        recordUuid,
        entityDefUuid,
        entityNodeUuid,
        serverUrl,
        generatorOptions,
        generator,
        extension,
      })
    : await generator(generatorOptions)

  const { buffer, surveyName } = documentResult
  // Shorter printable names: omit redundant RecordForm suffix; item labels are sanitized
  // (no URL-encoding / % sequences) by ExportFileNameGenerator.
  const fileName =
    exportScope === PrintableExportScopes.currentPage
      ? ExportFileNameGenerator.generate({
          surveyName,
          cycle,
          itemName: NodeDef.getLabel(entityDef, langToUse) || NodeDef.getName(entityDef),
          extension,
        })
      : ExportFileNameGenerator.generate({ surveyName, cycle, extension })
  Response.sendFileContent({
    res: outputStream,
    fileName,
    content: buffer,
    contentSize: Buffer.byteLength(buffer),
    contentType,
  })
}

export const exportRecordDocx = ({
  user,
  surveyId,
  recordUuid,
  outputStream,
  lang = null,
  exportScope,
  entityDefUuid,
  entityNodeUuid,
  orientation,
  includeQrCode,
  serverUrl,
}: {
  user: ArenaUser
  surveyId: number
  recordUuid: string
  outputStream: ExpressResponse
  lang?: string
  exportScope: PrintableExportScope
  entityDefUuid: string
  entityNodeUuid: string
  orientation: PrintOrientation
  includeQrCode: boolean
  serverUrl: string
}) =>
  exportRecordDocument({
    user,
    surveyId,
    recordUuid,
    outputStream,
    lang,
    exportScope,
    entityDefUuid,
    entityNodeUuid,
    orientation,
    includeQrCode,
    serverUrl,
    generator: SurveyDocxGenerator.generateSurveyDocx,
    extension: 'docx',
    contentType: Response.contentTypes.docx,
  })

export const exportRecordPdf = ({
  user,
  surveyId,
  recordUuid,
  outputStream,
  lang = null,
  exportScope,
  entityDefUuid,
  entityNodeUuid,
  orientation,
  includeQrCode,
  serverUrl,
}: {
  user: ArenaUser
  surveyId: number
  recordUuid: string
  outputStream: ExpressResponse
  lang?: string
  exportScope: PrintableExportScope
  entityDefUuid: string
  entityNodeUuid: string
  orientation: PrintOrientation
  includeQrCode: boolean
  serverUrl: string
}) =>
  exportRecordDocument({
    user,
    surveyId,
    recordUuid,
    outputStream,
    lang,
    exportScope,
    entityDefUuid,
    entityNodeUuid,
    orientation,
    includeQrCode,
    serverUrl,
    generator: SurveyPdfGenerator.generateSurveyPdf,
    extension: 'pdf',
    contentType: Response.contentTypes.pdf,
  })
