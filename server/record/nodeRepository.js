const camelize = require('camelize')
const R = require('ramda')

const db = require('../db/db')

const Node = require('../../common/record/node')
const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const dbTransformCallback = camelize

// ============== CREATE

const insertNode = async (surveyId, node, client = db) => {
  const parentUuid = Node.getParentUuid(node)

  const parentH = parentUuid
    ? await client.one(
      `SELECT id, meta->'h' as h FROM ${getSurveyDBSchema(surveyId)}.node WHERE uuid = $1`,
      [parentUuid]
    ) : []

  const meta = {
    h: R.isEmpty(parentH) ? [] : R.append(Number(parentH.id), parentH.h)
  }

  return await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
    (uuid, record_uuid, parent_uuid, node_def_uuid, value, meta)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
    RETURNING *, true as created`,
    [node.uuid, node.recordUuid, parentUuid, Node.getNodeDefUuid(node), JSON.stringify(node.value), meta],
    dbTransformCallback
  )
}

// ============== READ

const fetchNodesByRecordUuid = async (surveyId, recordUuid, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_uuid = $1
    ORDER BY id`,
    [recordUuid],
    dbTransformCallback
  )

const fetchNodeByUuid = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

const fetchDescendantNodesByCodeUuid = async (surveyId, recordUuid, parentCodeNodeUuid, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node n
    WHERE n.record_uuid = $1
      AND n.value @> '{"h": ["${parentCodeNodeUuid}"]}'
    ORDER BY id`,
    [recordUuid],
    dbTransformCallback
  )

const fetchParentNodeHierarchy = async (surveyId, nodeUuid, client = db) =>
  nodeUuid
    ? await client.one(`
        SELECT id, meta->'h' as h
        FROM ${getSurveyDBSchema(surveyId)}.node 
        WHERE uuid = $1`,
    [nodeUuid],
    row => R.append(Number(row.id), row.h))
    : []

// ============== UPDATE
const updateNode = async (surveyId, nodeUuid, value, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1, date_modified = now()
    WHERE uuid = $2
    RETURNING *, true as updated
    `, [value ? JSON.stringify(value) : null, nodeUuid],
    dbTransformCallback
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeUuid, client = db) =>
  await client.one(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING *,'{}' as value, true as deleted
    `, [nodeUuid],
    dbTransformCallback
  )

module.exports = {
  //CREATE
  insertNode,

  //READ
  fetchNodesByRecordUuid,
  fetchNodeByUuid,
  fetchDescendantNodesByCodeUuid,

  //UPDATE
  updateNode,

  //DELETE
  deleteNode,
}
