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

/**
 * Returns the list of duplicate entity key nodes, with record uuid and validation, in this format:
 *
 * {
 *   record_uuid,
 *   record_validation,
 *   node_uuids: ['NODE_UUID_1', 'NODE_UUID_2', ...]
 * }
 */
const fetchDuplicateEntityKeyNodeUuids = async (surveyId, nodeDefUuid, nodeDefKeyUuids, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.any(`
    WITH entity_key AS (
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

    SELECT r.uuid as record_uuid, r.validation as record_validation, json_agg(n.uuid) as node_uuids
    FROM ${schema}.node e
    JOIN ${schema}.node n
        ON n.parent_uuid = e.uuid 
        AND n.node_def_uuid in ($2:list)
    JOIN ${schema}.record r
        ON e.record_uuid = r.uuid
    WHERE e.node_def_uuid = $1
        AND EXISTS (
            SELECT ed.*
            FROM ${schema}.node ed
            WHERE 
              ed.parent_uuid = e.parent_uuid AND 
              ed.uuid != e.uuid AND 
              n.value != null AND
              (SELECT k1.key FROM entity_key k1 WHERE k1.parent_uuid = e.uuid)::text = (SELECT k2.key FROM entity_key k2 WHERE k2.parent_uuid = ed.uuid)::text
    )
    GROUP BY r.uuid, r.validation`,
    [nodeDefUuid, nodeDefKeyUuids]
  )
}

const fetchDuplicateEntityKeyNodeUuidsByRecord = async (surveyId, recordUuid, nodeDefUuid, nodeDefKeyUuids, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.any(`
    WITH entity_key AS (
       SELECT k.record_uuid, k.parent_uuid as entity_uuid, json_agg(k.value)::text as key
        FROM (
                SELECT k.record_uuid, k.parent_uuid, k.value
                FROM ${schema}.node k 
                WHERE 
                        k.record_uuid = $1 
                        AND k.node_def_uuid in ($3:list)
                --order by node def uuid to ensure getting always key nodes in the same order
                ORDER by k.record_uuid, k.parent_uuid, k.node_def_uuid
                ) k
        GROUP by k.record_uuid, k.parent_uuid
    )
    
    SELECT r.uuid, r.validation, json_agg(n.uuid) as node_uuids
    FROM ${schema}.node e
    JOIN ${schema}.node n
       ON    n.record_uuid = e.record_uuid 
         AND n.record_uuid = $1
         AND n.parent_uuid = e.uuid
         AND n.node_def_uuid in ($3:list)
         AND n.value IS NOT NULL
    JOIN ${schema}.record r
            ON e.record_uuid = r.uuid
    WHERE 
          --entity should not be root
            e.parent_uuid IS NOT NULL
          AND e.node_def_uuid = $2
    --has a duplicate entity
    AND EXISTS (
            SELECT *
            FROM ${schema}.node ed
            WHERE 
             --same record
              ed.record_uuid = e.record_uuid
              --same parent entity
              AND ed.parent_uuid = e.parent_uuid
              --same entity def
              AND ed.node_def_uuid = e.node_def_uuid 
              --different entity
              AND ed.uuid != e.uuid
              --same entity key attribute values
              AND (SELECT k1.key FROM entity_key k1 WHERE k1.record_uuid = e.record_uuid AND k1.entity_uuid = e.uuid)::text = 
                    (SELECT k2.key FROM entity_key k2 WHERE k2.record_uuid = ed.record_uuid AND k2.entity_uuid = ed.uuid)::text
    )
    GROUP BY r.uuid, r.validation`,
    [recordUuid, nodeDefUuid, nodeDefKeyUuids]
  )
}

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
  fetchDuplicateEntityKeyNodeUuidsByRecord,

  //UPDATE
  updateNode,
  updateChildrenApplicability,

  //DELETE
  deleteNode,

  //UTILS
  disableTriggers: async (surveyId, client = db) => await disableSurveySchemaTableTriggers(surveyId, 'node', client),
  enableTriggers: async (surveyId, client = db) => await enableSurveySchemaTableTriggers(surveyId, 'node', client),
}
