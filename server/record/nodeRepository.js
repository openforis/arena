const camelize = require('camelize')
const db = require('../db/db')

const Node = require('../../common/record/node')
const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const dbTransformCallback = camelize

// ============== CREATE

const insertNode = async (surveyId, node, client = db) =>
  await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
    (uuid, record_id, parent_uuid, node_def_uuid, value)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [node.uuid, node.recordId, Node.getParentUuid(node), Node.getNodeDefUuid(node), node.value ? JSON.stringify(node.value) : null],
    dbTransformCallback
  )

// ============== READ

const fetchNodesByRecordId = async (surveyId, recordId, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_id = $1
    ORDER BY id`,
    [recordId],
    dbTransformCallback
  )

const fetchNodeByUuid = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

const fetchDescendantNodesByCodeUuid = async (surveyId, recordId, parentCodeNodeUuid, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node n
    WHERE n.record_id = $1
      AND n.value @> '{"h": ["${parentCodeNodeUuid}"]}'
    ORDER BY id`,
    [recordId],
    dbTransformCallback
  )

// ============== UPDATE
const updateNode = async (surveyId, nodeUuid, value, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1, date_modified = now()
    WHERE uuid = $2
    RETURNING *
    `, [value ? JSON.stringify(value) : null, nodeUuid],
    dbTransformCallback
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeUuid, client = db) =>
  await client.one(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING *
    `, [nodeUuid],
    dbTransformCallback
  )

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodesByRecordId,
  fetchNodeByUuid,
  fetchDescendantNodesByCodeUuid,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}
