const db = require('../db/db')

const {surveyDataSchema} = require('../../common/survey/survey')
const {recordLogType} = require('../../common/record/record')

const insertRecordCreatedLog = async (surveyId, user, record, client = db) =>
  insertNodeLog(recordLogType.recordCreated, surveyId, user, record, client)

const insertNodeAddedLog = async (surveyId, user, node, client = db) =>
  insertNodeLog(recordLogType.nodeAdded, surveyId, user, {
    recordId: node.recordId,
    parentId: node.parentId,
    nodeDefId: node.nodeDefId,
    id: node.id,
    uuid: node.uuid,
    value: node.value,
    dataCreated: node.dataCreated,
  }, client)

const insertNodeUpdatedLog = async (surveyId, user, node, client = db) =>
  insertNodeLog(recordLogType.nodeUpdated, surveyId, user, {
    recordId: node.recordId,
    id: node.id,
    value: node.value,
  }, client)

const insertNodeDeletedLog = async (surveyId, user, node, client = db) =>
  insertNodeLog(recordLogType.nodeDeleted, surveyId, user, {
    recordId: node.recordId,
    id: node.id,
  }, client)

const insertNodeLog = async (actionType, surveyId, user, node, client = db) => client.tx(
  async tx =>
    await tx.one(
      `INSERT INTO ${surveyDataSchema(surveyId)}.record_update_log (action, user_id, node)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [actionType, user.id, node]
    )
)

module.exports = {
  // CREATE
  insertRecordCreatedLog,
  insertNodeAddedLog,
  insertNodeUpdatedLog,
  insertNodeDeletedLog,

  // READ

  //UPDATE
}
