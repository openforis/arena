import * as fs from 'fs'

import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordFile from '@core/record/recordFile'
import * as Authorizer from '@core/auth/authorizer'
import * as PromiseUtils from '@core/promiseUtils'

import * as JobManager from '@server/job/jobManager'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'
import * as FileManager from '../manager/fileManager'

import * as RecordServiceThreads from './update/recordServiceThreads'
import { messageTypes as RecordThreadMessageTypes } from './update/thread/recordThreadMessageTypes'

const Logger = Log.getLogger('RecordService')

/**
 * ======
 * RECORD
 * ======
 */
export const createRecord = async (socketId, user, surveyId, recordToCreate) => {
  Logger.debug('create record: ', recordToCreate)

  const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

  // Create record thread and initialize record
  const thread = RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, Record.getUuid(recordToCreate))
  thread.postMessage({ type: RecordThreadMessageTypes.recordInit })

  return record
}

export const {
  fetchRecordsUuidAndCycle,
  fetchRecordByUuid,
  fetchRecordAndNodesByUuid,
  countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchRecordSummaryByRecordUuid,
  fetchRecordCreatedCountsByDates,
  updateRecordsStep,
} = RecordManager

export const updateRecordStep = async (user, surveyId, recordUuid, stepId) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)
  return await RecordManager.updateRecordStepInTransaction({ user, surveyId, record, stepId })
}

export const deleteRecord = async (socketId, user, surveyId, recordUuid) => {
  Logger.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle: Record.getCycle(record) })
  await RecordManager.deleteRecord(user, survey, record)

  // Notify other users viewing or editing the record it has been deleted
  const socketIds = RecordServiceThreads.getSocketIds(recordUuid)
  socketIds.forEach((socketIdCurrent) => {
    if (socketIdCurrent !== socketId) {
      WebSocketServer.notifyUser(socketIdCurrent, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  RecordServiceThreads.dissocSocketsByRecordUuid(recordUuid)
}

export const deleteRecords = async ({ user, surveyId, recordUuids }) => {
  Logger.debug('delete records. surveyId:', surveyId, 'recordUuids:', recordUuids)

  await PromiseUtils.each(recordUuids, async (recordUuid) => {
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle: Record.getCycle(record) })
    await RecordManager.deleteRecord(user, survey, record)
  })
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
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  }

  RecordServiceThreads.dissocSocket(socketId)
}

export const dissocSocketFromRecordThread = RecordServiceThreads.dissocSocket

export const { fetchValidationReport, countValidationReportItems } = RecordManager

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

export const writeDataImportFromCSVTemplateToStream = async ({ surveyId, cycle, entityDefUuid, outputStream }) => {
  await CSVWriter.writeToStream(outputStream, [{ attr1: '', attr2: '' }])
}

/**
 * ======
 * NODE
 * ======
 */
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
