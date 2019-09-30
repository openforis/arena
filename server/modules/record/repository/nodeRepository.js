const R = require('ramda')
const camelize = require('camelize')

const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')

const Node = require('../../../../common/record/node')
const { getSurveyDBSchema, disableSurveySchemaTableTriggers, enableSurveySchemaTableTriggers } = require('../../survey/repository/surveySchemaRepositoryUtils')

// ============== UTILS

//camelize all but "meta"
const dbTransformCallback = node =>
  node
    ? R.pipe(
    R.dissoc(Node.keys.meta),
    camelize,
    R.assoc(Node.keys.meta, R.prop(Node.keys.meta, node))
    )(node)
    : null

const getNodeSelectQuery = (surveyId, draft) => {
  const schema = getSurveyDBSchema(surveyId)

  const propsTaxon = DbUtils.getPropsCombined(draft, 't.', false)
  const propsVernacularName = DbUtils.getPropsCombined(draft, 'v.', false)
  const propsCategoryItem = DbUtils.getPropsCombined(draft, 'c.', false)

  return `
    SELECT
        n.*,
        CASE
            WHEN n.value->>'taxonUuid' IS NOT NULL
            THEN json_build_object( 'taxon',json_build_object('id',t.id, 'uuid',t.uuid, 'taxonomy_uuid',t.taxonomy_uuid, 'props',${propsTaxon}, 'vernacular_name_uuid',v.uuid, 'vernacular_language',(${propsVernacularName})->>'lang', 'vernacular_name',(${propsVernacularName})->>'name') )
            WHEN n.value->>'itemUuid' IS NOT NULL
            THEN json_build_object( 'category_item',json_build_object('id',c.id, 'uuid',c.uuid, 'level_uuid',c.level_uuid, 'parent_uuid',c.parent_uuid, 'props',${propsCategoryItem}) )
            ELSE NULL
        END AS ref_data
    FROM
        ${schema}.node n
    LEFT OUTER JOIN
        ${schema}.category_item c
    ON
        (n.value->>'${Node.valuePropKeys.itemUuid}')::uuid = c.uuid
    LEFT OUTER JOIN
        ${schema}.taxon t
    ON
        (n.value->>'${Node.valuePropKeys.taxonUuid}')::uuid = t.uuid
    LEFT OUTER JOIN
        ${schema}.taxon_vernacular_name v
    ON
        (n.value->>'${Node.valuePropKeys.vernacularNameUuid}')::uuid = v.uuid`
}

// ============== CREATE

const insertNode = async (surveyId, node, draft, client = db) => {
  const meta = {
    ...Node.getMeta(node),
    [Node.metaKeys.hierarchy]: Node.getHierarchy(node),
    [Node.metaKeys.childApplicability]: {}
  }

  await client.query(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
        (uuid, record_uuid, parent_uuid, node_def_uuid, value, meta)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [Node.getUuid(node), Node.getRecordUuid(node), Node.getParentUuid(node), Node.getNodeDefUuid(node), stringifyValue(Node.getValue(node, null)), meta],
  )

  const nodeAdded = await client.one(`
    ${getNodeSelectQuery(surveyId, draft)}
    WHERE n.uuid = $1
  `,
    Node.getUuid(node),
    dbTransformCallback
  )
  return { ...nodeAdded, [Node.keys.created]: true }
}

const insertNodesFromValues = async (surveyId, nodeValues, client = db) =>
  await client.none(DbUtils.insertAllQuery(
    getSurveyDBSchema(surveyId),
    'node',
    ['uuid', 'date_created', 'date_modified', 'record_uuid', 'parent_uuid', 'node_def_uuid', 'value', 'meta'],
    nodeValues
  ))

// ============== READ

const fetchNodesByRecordUuid = async (surveyId, recordUuid, draft, client = db) =>
  await client.map(`
    ${getNodeSelectQuery(surveyId, draft)}
    WHERE n.record_uuid = $1
    `,
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
const updateNode = async (surveyId, nodeUuid, value, meta = {}, draft, client = db) => {
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1,
    meta = meta || $2::jsonb, 
    date_modified = ${DbUtils.now}
    WHERE uuid = $3
    `, [stringifyValue(value), meta, nodeUuid]
  )
  const node = await client.one(`
    ${getNodeSelectQuery(surveyId, draft)}
    WHERE n.uuid = $1
  `,
    nodeUuid,
    dbTransformCallback
  )
  return { ...node, [Node.keys.updated]: true }
}

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

const deleteNodesByNodeDefUuids = async (surveyId, nodeDefUuids, client = db) =>
  await client.manyOrNone(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE node_def_uuid IN ($1:csv)
    RETURNING *, true as ${Node.keys.deleted}
    `,
    [nodeDefUuids],
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

  //UPDATE
  updateNode,
  updateChildrenApplicability,

  //DELETE
  deleteNode,
  deleteNodesByNodeDefUuids,

  //UTILS
  disableTriggers: async (surveyId, client = db) => await disableSurveySchemaTableTriggers(surveyId, 'node', client),
  enableTriggers: async (surveyId, client = db) => await enableSurveySchemaTableTriggers(surveyId, 'node', client),
}
