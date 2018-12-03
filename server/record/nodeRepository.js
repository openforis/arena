const camelize = require('camelize')
const db = require('../db/db')

const Node = require('../../common/record/node')
const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const dbTransformCallback = camelize

// All columns but 'file'
const nodeColumns = 'id, uuid, record_id, parent_uuid, node_def_uuid, value, date_created'

// ============== CREATE

const insertNode = async (surveyId, node, fileContent, client = db) =>
  await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
    (uuid, record_id, parent_uuid, node_def_uuid, value, file)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${nodeColumns}`,
    [node.uuid, node.recordId, Node.getParentUuid(node), Node.getNodeDefUuid(node), node.value ? JSON.stringify(node.value) : null, fileContent],
    dbTransformCallback
  )

// ============== READ

const fetchNodesByRecordId = async (surveyId, recordId, client = db) =>
  await client.map(`
    SELECT ${nodeColumns} FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_id = $1
    ORDER BY id`,
    [recordId],
    dbTransformCallback
  )

const fetchNodeByUUID = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(`
    SELECT ${nodeColumns} FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

const fetchNodeFileByUUID = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(`
    SELECT value, file FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid]
  )

const fetchDescendantNodesByCodeUuid = async (surveyId, recordId, parentCodeNodeUUID, client = db) =>
  await client.map(`
    SELECT ${nodeColumns} FROM ${getSurveyDBSchema(surveyId)}.node n
    WHERE n.record_id = $1
      AND n.value @> '{"h": ["${parentCodeNodeUUID}"]}'
    ORDER BY id`,
    [recordId],
    dbTransformCallback
  )

// ============== UPDATE
const updateNode = async (surveyId, nodeUUID, value, fileContent = null, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1, file = $2, date_modified = now()
    WHERE uuid = $3
    RETURNING ${nodeColumns}
    `, [value ? JSON.stringify(value) : null, fileContent, nodeUUID],
    dbTransformCallback
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeUuid, client = db) =>
  await client.one(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING ${nodeColumns}
    `, [nodeUuid],
    dbTransformCallback
  )

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodesByRecordId,
  fetchNodeByUUID,
  fetchNodeFileByUUID,
  fetchDescendantNodesByCodeUuid,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}
