const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const FileManager = require('../file/fileManager')

const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')
const File = require('../../common/file/file')

const { toUuidIndexedObj } = require('../../common/survey/surveyUtils')
const { isBlank } = require('../../common/stringUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')
const ActivityLog = require('../activityLog/activityLogger')

const { canEditRecord } = require('../../common/auth/authManager')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = async (user, surveyId, record) =>
  await RecordUpdateManager.createRecord(user, surveyId, record)

/**
 * ===================
 * READ
 * ===================
 */
const fetchRecordsSummaryBySurveyId = async (surveyId, offset, limit, client = db) => {
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(surveyId, false, client)
  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, false, client)
  const records = await RecordRepository.fetchRecordsSummaryBySurveyId(surveyId, nodeDefRoot, nodeDefKeys, offset, limit, client)

  return {
    nodeDefKeys,
    records
  }
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
  return record
}

const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, client = db) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, client)

  return { ...record, nodes: toUuidIndexedObj(nodes) }
}

/**
 * ===================
 * UPDATE
 * ===================
 */

const persistNode = (user, surveyId, node, fileReq) => {
  let nodeToPersist
  if (fileReq) {
    //save file to "file" table and set fileUuid and fileName into node value
    const file = File.createFile(fileReq)

    FileManager.insertFile(surveyId, file)

    const nodeValue = {
      fileUuid: file.uuid,
      fileName: File.getName(file),
      fileSize: File.getSize(file)
    }

    nodeToPersist = Node.assocValue(nodeValue, node)
  } else {
    nodeToPersist = node
  }
  RecordUpdateManager.persistNode(user, surveyId, nodeToPersist)
}

const updateRecordStep = (surveyId, recordUuid, step) => {
  const record = RecordRepository.fetchRecordByUuid(surveyId, recordUuid)
  const currentStep = Record.getStep(record)

  // check if the user is allowed to set the new step
  if (Math.abs(step - currentStep) > 1 || step < 0 || R.keys(Survey.defaultSteps).indexOf(step) === -1) {
    throw new Error('Can\'t update step')
  }

  RecordRepository.updateRecordStep(surveyId, recordUuid, step)
}

/**
 * ===================
 * DELETE
 * ===================
 */
const deleteRecord = async (user, surveyId, recordUuid) =>
  await db.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.recordDelete, { recordUuid }, t)
    await RecordRepository.deleteRecord(user, surveyId, recordUuid, t)
  })

const deleteNode = (user, surveyId, nodeUuid) => RecordUpdateManager.deleteNode(user, surveyId, nodeUuid)

/**
 * ==================
 * CHECK IN / OUT RECORD
 * ==================
 */
const checkInRecord = async (user, surveyId, recordUuid) => {
  const record = await fetchRecordAndNodesByUuid(surveyId, recordUuid)

  if (canEditRecord(user, record)) {
    RecordUpdateManager.checkIn(user, surveyId, Record.isPreview(record))
  }

  return record
}

const checkOutRecord = async (user, surveyId, recordUuid) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await deleteRecordPreview(user, surveyId, recordUuid)
  }

  RecordUpdateManager.checkOut(user.id)
}

const deleteRecordPreview = async (user, surveyId, recordUuid) =>
  await db.tx(async t => {
    const record = await fetchRecordAndNodesByUuid(surveyId, recordUuid, t)

    const fileUuids = R.pipe(
      Record.getNodesArray,
      R.map(Node.getNodeFileUuid),
      R.reject(isBlank),
    )(record)
    // delete record and files
    await Promise.all([
        RecordRepository.deleteRecord(user, surveyId, Record.getUuid(record), t),
        ...fileUuids.map(fileUuid => FileManager.deleteFileByUuid(surveyId, fileUuid, t)),
      ]
    )

  })

module.exports = {
  //==== CREATE
  createRecord,

  //==== READ
  fetchRecordByUuid,
  fetchRecordAndNodesByUuid,
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchNodeByUuid: NodeRepository.fetchNodeByUuid,
  fetchChildNodeByNodeDefUuid: NodeRepository.fetchChildNodeByNodeDefUuid,

  //==== UPDATE
  persistNode,
  updateRecordStep,

  //==== DELETE
  deleteRecord,
  deleteNode,

  //==== UTILS
  checkInRecord,
  checkOutRecord,
}
