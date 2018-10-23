const camelize = require('camelize')
const db = require('../db/db')

const {getSurveyDBSchema} = require('../../common/survey/survey')

const dbTransformCallback = camelize

// ============== CREATE

const insertNode = async (surveyId, node, client = db) => {
  const parent = await client.oneOrNone(`
    SELECT id FROM ${getSurveyDBSchema(surveyId)}.node WHERE uuid = $1
    `,
    [node.parentUUID])

  return await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node 
    (uuid, record_id, parent_id, node_def_id, value)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [node.uuid, node.recordId, parent ? parent.id : null, node.nodeDefId, node.value ? JSON.stringify(node.value) : null],
    dbTransformCallback
  )
}

// ============== READ

const fetchNodesByRecordId = async (surveyId, recordId, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node 
    WHERE record_id = $1 
    ORDER BY parent_id, id`,
    [recordId],
    dbTransformCallback
  )

const fetchNodeByUUID = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node 
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

// ============== UPDATE
const updateNode = async (surveyId, nodeUUID, value, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node 
    SET value = $1 
    WHERE uuid = $2
    RETURNING *
    `, [value ? JSON.stringify(value) : null, nodeUUID],
    dbTransformCallback
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeUUID, client = db) =>
  await client.one(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING *
    `, [nodeUUID],
    dbTransformCallback
  )

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodesByRecordId,
  fetchNodeByUUID,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}