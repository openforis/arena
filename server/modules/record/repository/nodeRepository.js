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

const insertNodes = async (surveyId, nodes, client = db) => {
  const values = nodes.map(n => [
    Node.getUuid(n),
    Node.getRecordUuid(n),
    Node.getParentUuid(n),
    Node.getNodeDefUuid(n),
    stringifyValue(Node.getValue(n, null)),
    {
      ...n.meta,
      [Node.metaKeys.childApplicability]: {}
    }
  ])

  await client.none(insertAllQuery(
    getSurveyDBSchema(surveyId),
    'node',
    ['uuid', 'record_uuid', 'parent_uuid', 'node_def_uuid', 'value', 'meta'],
    values
  ))
}
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
  insertNodes,

  //READ
  fetchNodesByRecordUuid,
  fetchNodeByUuid,
  fetchChildNodesByNodeDefUuid,
  fetchChildNodeByNodeDefUuid,

  //UPDATE
  updateNode,
  updateChildrenApplicability,

  //DELETE
  deleteNode,

  //UTILS
  disableTriggers: async (surveyId, client = db) => await disableSurveySchemaTableTriggers(surveyId, 'node', client),
  enableTriggers: async (surveyId, client = db) => await enableSurveySchemaTableTriggers(surveyId, 'node', client),
}
