const R = require('ramda')
const camelize = require('camelize')

const db = require('../../../db/db')
const { now, insertAllQuery } = require('../../../db/dbUtils')

const Node = require('../../../../common/record/node')
const { getSurveyDBSchema, disableSurveySchemaTableTriggers, enableSurveySchemaTableTriggers } = require('../../survey/repository/surveySchemaRepositoryUtils')

//camelize all but "meta"
const dbTransformCallback = node =>
  node
    ? R.pipe(
    R.dissoc(Node.keys.meta),
    camelize,
    R.assoc(Node.keys.meta, R.prop(Node.keys.meta, node))
    )(node)
    : null

// ============== CREATE

const insertNode = (surveyId, node, client = db) => {
  const meta = {
    ...Node.getMeta(node),
    [Node.metaKeys.hierarchy]: Node.getHierarchy(node),
    [Node.metaKeys.childApplicability]: {}
  }

  return client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.node
        (uuid, record_uuid, parent_uuid, node_def_uuid, value, meta)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING *, true as ${Node.keys.created}
      `, [Node.getUuid(node), Node.getRecordUuid(node), Node.getParentUuid(node), Node.getNodeDefUuid(node), stringifyValue(Node.getValue(node, null)), meta],
    dbTransformCallback
  )
}

const insertNodesFromValues = async (surveyId, nodeValues, client = db) =>
  await client.none(insertAllQuery(
    getSurveyDBSchema(surveyId),
    'node',
    ['uuid', 'date_created', 'date_modified', 'record_uuid', 'parent_uuid', 'node_def_uuid', 'value', 'meta'],
    nodeValues
  ))

// ============== READ

const fetchNodesByRecordUuid = async (surveyId, recordUuid, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_uuid = $1
    ORDER BY date_created`,
    [recordUuid],
    dbTransformCallback
  )

const fetchNodeByUuid = async (surveyId, uuid, client = db) =>
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

const fetchChildNodesByNodeDefUuids = async (surveyId, recordUuid, nodeUuid, childDefUUids, client = db) =>
  await client.map(`
    SELECT * 
    FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_uuid = $1
      AND parent_uuid ${nodeUuid ? '= $2' : 'is null'}
      AND node_def_uuid IN ($3:csv)`,
    [recordUuid, nodeUuid, childDefUUids],
    dbTransformCallback
  )

const fetchChildNodesByNodeDefUuid = async (surveyId, recordUuid, nodeUuid, childDefUUid, client = db) =>
  await fetchChildNodesByNodeDefUuids(surveyId, recordUuid, nodeUuid, [childDefUUid], client)

const fetchChildNodeByNodeDefUuid = async (surveyId, recordUuid, nodeUuid, childDefUUid, client = db) => {
  const nodes = await fetchChildNodesByNodeDefUuid(surveyId, recordUuid, nodeUuid, childDefUUid, client)
  return R.head(nodes)
}

const fetchDuplicateEntityKeyNodeUuids = async (surveyId, nodeDefUuid, nodeDefKeyUuids, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.any(`
    WITH node_key AS (
      SELECT k.parent_uuid, json_agg(k.value)::text as key
      FROM (
         SELECT k.parent_uuid, k.value
         FROM ${schema}.node k 
         WHERE k.node_def_uuid in ($2:list)
         --order by node def uuid to ensure getting always key nodes in the same order
         ORDER by k.parent_uuid, k.node_def_uuid
      ) k
      GROUP by k.parent_uuid
    )

    SELECT e.record_uuid, json_agg(n.uuid) as node_uuids
    FROM ${schema}.node e
      JOIN ${schema}.node n
        ON n.record_uuid = e.record_uuid 
          AND n.parent_uuid = e.uuid AND n.node_def_uuid in ($2:list)
    WHERE e.node_def_uuid = $1
    AND EXISTS (
        SELECT n1.*
        FROM ${schema}.node n1
        WHERE n1.parent_uuid = e.parent_uuid
          AND n1.uuid != e.uuid
          AND (SELECT k1.key FROM node_key k1 WHERE k1.parent_uuid = e.uuid)::text = (SELECT k.key FROM node_key k WHERE k.parent_uuid = e.uuid)::text
    )
    GROUP BY e.record_uuid`,
    [nodeDefUuid, nodeDefKeyUuids]
  )
}

/*
const fetchDuplicateEntityKeyNodeUuids = async (surveyId, recordUuid, nodeDefUuid, nodeDefKeyUuids, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.any(`
    WITH node_key AS (
      SELECT k.parent_uuid, json_agg(k.value)::text as key
      FROM (
         SELECT k.parent_uuid, k.value
         FROM ${schema}.node k 
         WHERE k.record_uuid = $1 AND 
               k.node_def_uuid in ($3:list)
         --order by node def uuid to ensure getting always key nodes in the same order
         ORDER by k.parent_uuid, k.node_def_uuid
      ) k
      GROUP by k.parent_uuid
    )

    SELECT json_agg(n.uuid) as node_uuids
    FROM ${schema}.node e
      JOIN ${schema}.node n
        ON n.record_uuid = e.record_uuid AND 
           n.parent_uuid = e.uuid AND n.node_def_uuid in ($3:list)
    WHERE e.record_uuid = $1 AND 
          e.node_def_uuid = $2
    AND EXISTS (
        SELECT ed.*
        FROM ${schema}.node ed
        WHERE ed.record_uuid = $1 AND 
          ed.parent_uuid = e.parent_uuid AND 
          ed.uuid != e.uuid AND 
          (SELECT k1.key FROM node_key k1 WHERE k1.parent_uuid = e.uuid)::text = (SELECT k.key FROM node_key k WHERE k.parent_uuid = ed.uuid)::text
    )
    GROUP BY e.record_uuid`,
    [recordUuid, nodeDefUuid, nodeDefKeyUuids]
  )
}
*/

// ============== UPDATE
const updateNode = async (surveyId, nodeUuid, value, meta = {}, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1,
    meta = meta || $2::jsonb, 
    date_modified = ${now}
    WHERE uuid = $3
    RETURNING *, true as ${Node.keys.updated}
    `, [stringifyValue(value), meta, nodeUuid],
    dbTransformCallback
  )

const updateChildrenApplicability = async (surveyId, parentNodeUuid, childDefUuid, applicable, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET meta = jsonb_set(meta, '{"${Node.metaKeys.childApplicability}", "${childDefUuid}"}', '${applicable}')
    WHERE uuid = $1
    RETURNING *`,
    [parentNodeUuid],
    dbTransformCallback
  )

// ============== DELETE
const deleteNode = async (surveyId, nodeUuid, client = db) =>
  await client.one(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING *, true as ${Node.keys.deleted}
    `, [nodeUuid],
    dbTransformCallback
  )

const stringifyValue = value => {
  const isJsonString = str => {
    try {
      return R.is(Object, JSON.parse(str))
    } catch (e) {
      return false
    }
  }

  return R.ifElse(
    R.isNil,
    R.identity,
    R.ifElse(
      v => R.is(String, v) && isJsonString(v),
      R.identity,
      v => JSON.stringify(v)
    )
  )(value)
}

module.exports = {
  //CREATE
  insertNode,
  insertNodesFromValues,

  //READ
  fetchNodesByRecordUuid,
  fetchNodeByUuid,
  fetchChildNodesByNodeDefUuid,
  fetchChildNodeByNodeDefUuid,
  fetchDuplicateEntityKeyNodeUuids,

  //UPDATE
  updateNode,
  updateChildrenApplicability,

  //DELETE
  deleteNode,

  //UTILS
  disableTriggers: async (surveyId, client = db) => await disableSurveySchemaTableTriggers(surveyId, 'node', client),
  enableTriggers: async (surveyId, client = db) => await enableSurveySchemaTableTriggers(surveyId, 'node', client),
}
