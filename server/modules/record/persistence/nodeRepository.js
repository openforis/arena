const camelize = require('camelize')
const R = require('ramda')

const db = require('../../../db/db')
const { now } = require('../../../db/dbUtils')

const Node = require('../../../../common/record/node')
const { getSurveyDBSchema } = require('../../survey/persistence/surveySchemaRepositoryUtils')

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

const insertNode = async (surveyId, node, client = db) => {
  const parentUuid = Node.getParentUuid(node)

  const parentH = parentUuid
    ? await client.one(
      `SELECT meta->'h' as h FROM ${getSurveyDBSchema(surveyId)}.node WHERE uuid = $1`,
      [parentUuid]
    ) : []

  const meta = {
    h: R.isEmpty(parentH) ? [] : R.append(parentUuid, parentH.h),
    [Node.metaKeys.childApplicability]: {} //applicability of child nodes
  }

  return await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
    (uuid, record_uuid, parent_uuid, node_def_uuid, value, meta)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING *, true as ${Node.keys.created}`,
    [node.uuid, node.recordUuid, parentUuid, Node.getNodeDefUuid(node), stringifyValue(node.value), meta],
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
  await client.one(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

const fetchAncestorByNodeDefUuid = async (surveyId, nodeUuid, ancestorNodeDefUuid, client = db) => {
  const hierarchy = await client.one(
    `SELECT meta->'h' as h FROM ${getSurveyDBSchema(surveyId)}.node WHERE uuid = $1`,
    [nodeUuid],
    R.prop('h')
  )
  if (R.isEmpty(hierarchy)) {
    return []
  } else {
    return await client.one(
      `SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
       WHERE uuid in (${R.pipe(R.map(el => `'${el}'`), R.join(', '))(hierarchy)})
        AND node_def_uuid = $1`,
      [ancestorNodeDefUuid],
      dbTransformCallback
    )
  }
}

const fetchDescendantNodesByCodeUuid = async (surveyId, recordUuid, parentCodeNodeUuid, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node n
    WHERE n.record_uuid = $1
      AND n.value @> '{"h": ["${parentCodeNodeUuid}"]}'
    ORDER BY id`,
    [recordUuid],
    dbTransformCallback
  )

const fetchSelfOrDescendantNodes = async (surveyId, nodeDefUuid, recordUuid, parentNodeUuid, client = db) =>
  await client.map(`
    SELECT * 
    FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_uuid = $1
      AND node_def_uuid = $2
      AND (uuid = $3 OR meta @> '{"h": ["${parentNodeUuid}"]}')`,
    [recordUuid, nodeDefUuid, parentNodeUuid],
    dbTransformCallback
  )

const fetchChildNodeByNodeDefUuid = async (surveyId, recordUuid, nodeUuid, childDefUUid, client = db) => {
  const nodes = await fetchChildNodesByNodeDefUuid(surveyId, recordUuid, nodeUuid, childDefUUid, client)
  return R.head(nodes)
}

const fetchChildNodesByNodeDefUuid = async (surveyId, recordUuid, nodeUuid, childDefUUid, client = db) =>
  await fetchChildNodesByNodeDefUuids(surveyId, recordUuid, nodeUuid, [childDefUUid], client)

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
    RETURNING *,'{}' as value, true as ${Node.keys.deleted}
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

  //READ
  fetchNodesByRecordUuid,
  fetchNodeByUuid,
  fetchAncestorByNodeDefUuid,
  fetchDescendantNodesByCodeUuid,
  fetchSelfOrDescendantNodes,
  fetchChildNodeByNodeDefUuid,
  fetchChildNodesByNodeDefUuid,
  fetchChildNodesByNodeDefUuids,

  //UPDATE
  updateNode,
  updateChildrenApplicability,

  //DELETE
  deleteNode,
}
