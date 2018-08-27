const camelize = require('camelize')
const db = require('../db/db')

const {getSurveyDBSchema} = require('../../common/survey/survey')

const dbTransformCallback = r =>
  r ? camelize(r)
    : null

// ============== CREATE

const insertNode = async (surveyId, node, client = db) =>
  await client.one(
    `INSERT INTO ${getSurveyDBSchema(surveyId)}.node (record_id, parent_id, node_def_id, value)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [node.recordId, node.parentId, node.nodeDefId, node.value],
    r => dbTransformCallback(r)
  )

// ============== READ

const fetchNodes = async (surveyId, recordId, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.node WHERE record_id = $1 
     ORDER BY parent_id, id`,
    [recordId],
    r => dbTransformCallback(r)
  )

const fetchNodeById = async (surveyId, nodeId, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.node WHERE id = $1`,
    [nodeId],
    r => dbTransformCallback(r)
  )

// ============== UPDATE
const updateNode = async (surveyId, nodeId, value, client = db) =>
  await client.one(`
      UPDATE ${getSurveyDBSchema(surveyId)}.node 
      SET value = $1 
      WHERE id = $2
      RETURNING *
    `, [value, nodeId],
    r => dbTransformCallback(r)
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeId, client = db) =>
  await client.one(
    `DELETE ${getSurveyDBSchema(surveyId)}.node
     WHERE id = $1
     RETURNING *
    `, [nodeId],
    r => dbTransformCallback(r)
  )

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodeById,
  fetchNodes,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}