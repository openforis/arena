import * as R from 'ramda'

import * as A from '@core/arena'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as Node from '@core/record/node'
import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

export const tableColumnsInsert = [
  'uuid',
  'date_created',
  'date_modified',
  'record_uuid',
  'parent_uuid',
  'node_def_uuid',
  'value',
  'meta',
] // Used for node values batch insert

const tableColumnsSelect = ['id', ...tableColumnsInsert]

// ============== UTILS

// camelize all but "meta"
const dbTransformCallback = (node) => {
  // do not camelize meta properties
  const nodeTransformed = A.camelizePartial({ skip: [Node.keys.meta] })(node)
  // cast id to Number
  nodeTransformed.id = Number(node.id)
  return nodeTransformed
}

const _toValueQueryParam = (value) => (value === null || A.isEmpty(value) ? null : JSON.stringify(value))
/**
 * It builds the node select query.
 *
 * @param {!object} params - The parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {boolean} [params.includeRefData = true] - If true, category item and taxon item associated to the node value will be fetched.
 * @param {boolean} [params.draft = true] - If true, draft category and taxonomy item props will be fetched, otherwise only published props.
 * @param {boolean} [params.excludeRecordUuid = false] - If true, the record uuid won't be included in the fetch (useful when selecting by record_uuid to make the query faster).
 * @returns {Array} - List of fetched nodes.
 */
const _getNodeSelectQuery = ({ surveyId, includeRefData = true, draft = true, excludeRecordUuid = false }) => {
  const schema = getSurveyDBSchema(surveyId)

  const selectFields = (excludeRecordUuid ? R.without(['record_uuid'], tableColumnsSelect) : tableColumnsSelect)
    .map((field) => `n.${field}`)
    .join(', ')

  if (!includeRefData) {
    return `SELECT ${selectFields} FROM ${schema}.node n`
  }

  // include ref data (category items, taxa, etc.)

  const propsTaxon = DbUtils.getPropsCombined(draft, 't.', false)
  const propsVernacularName = DbUtils.getPropsCombined(draft, 'v.', false)
  const propsCategoryItem = DbUtils.getPropsCombined(draft, 'c.', false)

  return `
    SELECT
        ${selectFields},
        CASE
            WHEN n.value->>'taxonUuid' IS NOT NULL
            THEN json_build_object( 'taxon',json_build_object('id',t.id, 'uuid',t.uuid, 'taxonomy_uuid',t.taxonomy_uuid, 'props',${propsTaxon}, 'vernacular_name_uuid',v.uuid, 'vernacular_language',(${propsVernacularName})->>'lang', 'vernacular_name',(${propsVernacularName})->>'name') )
            WHEN n.value->>'itemUuid' IS NOT NULL
            THEN json_build_object( 'category_item',json_build_object('id',c.id, 'uuid',c.uuid, 'level_uuid',c.level_uuid, 'parent_uuid',c.parent_uuid, 'props',${propsCategoryItem}) )
            ELSE NULL
        END AS ref_data,
        (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = ${surveyId})
    FROM
        ${schema}.node n
    LEFT OUTER JOIN
        ${schema}.category_item c
    ON
        (n.value->>'${Node.valuePropsCode.itemUuid}')::uuid = c.uuid
    LEFT OUTER JOIN
        ${schema}.taxon t
    ON
        (n.value->>'${Node.valuePropsTaxon.taxonUuid}')::uuid = t.uuid
    LEFT OUTER JOIN
        ${schema}.taxon_vernacular_name v
    ON
        (n.value->>'${Node.valuePropsTaxon.vernacularNameUuid}')::uuid = v.uuid`
}

// ============== CREATE

export const insertNode = async (surveyId, node, draft, client = db) => {
  const meta = {
    ...Node.getMeta(node),
    [Node.metaKeys.hierarchy]: Node.getHierarchy(node),
    [Node.metaKeys.childApplicability]: {},
  }

  await client.query(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node
        (uuid, record_uuid, parent_uuid, node_def_uuid, value, meta)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
    `,
    [
      Node.getUuid(node),
      Node.getRecordUuid(node),
      Node.getParentUuid(node),
      Node.getNodeDefUuid(node),
      _toValueQueryParam(Node.getValue(node, null)),
      meta,
    ]
  )

  // reload node to get node ref data
  const nodeAdded = await fetchNodeWithRefDataByUuid({ surveyId, nodeUuid: Node.getUuid(node), draft }, client)

  return { ...nodeAdded, [Node.keys.created]: true }
}

export const insertNodesFromValues = async (surveyId, nodeValues, client = db) =>
  client.none(DbUtils.insertAllQuery(getSurveyDBSchema(surveyId), 'node', tableColumnsInsert, nodeValues))

export const insertNodesInBatch = async ({ surveyId, nodes = [] }, client = db) => {
  if (nodes.length === 0) return []

  const query = DbUtils.insertAllQueryBatch(
    getSurveyDBSchema(surveyId),
    'node',
    tableColumnsInsert,
    nodes.map((node) => ({
      ...node,
      date_created: Node.getDateCreated(node),
      date_modified: Node.getDateModified(node),
      record_uuid: Node.getRecordUuid(node),
      parent_uuid: Node.getParentUuid(node),
      node_def_uuid: Node.getNodeDefUuid(node),
      value: _toValueQueryParam(Node.getValue(node)),
      meta: Node.getMeta(node),
    }))
  )
  // assign generated ids to nodes (side effect)
  await client.map(query + ' RETURNING id', [], (row, index) => (nodes[index].id = row.id))
  return nodes
}

// ============== READ

export const fetchNodesByRecordUuid = async (
  { surveyId, recordUuid, includeRefData = true, draft = true },
  client = db
) =>
  client.map(
    `
    ${_getNodeSelectQuery({ surveyId, includeRefData, draft, excludeRecordUuid: true })}
    WHERE n.record_uuid = $1
    order by n.date_created
    `,
    [recordUuid],
    (row) => {
      const rowTransformed = dbTransformCallback(row)
      rowTransformed.recordUuid = recordUuid
      return rowTransformed
    }
  )

export const fetchNodeByUuid = async (surveyId, uuid, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    dbTransformCallback
  )

export const fetchNodesWithRefDataByUuids = async ({ surveyId, nodeUuids, draft }, client = db) =>
  client.map(
    `
    ${_getNodeSelectQuery({ surveyId, draft })}
    WHERE n.uuid IN ($1:list)
  `,
    [nodeUuids],
    dbTransformCallback
  )

export const fetchNodeWithRefDataByUuid = async ({ surveyId, nodeUuid, draft }, client = db) =>
  (await fetchNodesWithRefDataByUuids({ surveyId, nodeUuids: [nodeUuid], draft }, client))[0]

export const fetchChildNodesByNodeDefUuids = async (surveyId, recordUuid, nodeUuid, childDefUUids, client = db) =>
  client.map(
    `
    ${_getNodeSelectQuery({ surveyId, draft: false })}
    WHERE n.record_uuid = $1
      AND n.parent_uuid ${nodeUuid ? '= $2' : 'is null'}
      AND n.node_def_uuid IN ($3:csv)`,
    [recordUuid, nodeUuid, childDefUUids],
    dbTransformCallback
  )

// ============== UPDATE
export const updateNode = async (
  { surveyId, nodeUuid, value = null, meta = {}, draft, reloadNode = true },
  client = db
) => {
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1::jsonb,
    meta = meta || $2::jsonb, 
    date_modified = ${DbUtils.now}
    WHERE uuid = $3
    `,
    [_toValueQueryParam(value), meta || {}, nodeUuid]
  )
  if (!reloadNode) return null

  // fetch node with ref data
  const node = await fetchNodeWithRefDataByUuid({ surveyId, nodeUuid, draft }, client)
  node[Node.keys.updated] = true
  return node
}

export const updateNodes = async ({ surveyId, nodes }, client = db) => {
  const values = nodes.map((node) => [
    Node.getId(node),
    _toValueQueryParam(Node.getValue(node)),
    Node.getMeta(node),
    Node.getDateModified(node),
  ])
  await client.none(
    DbUtils.updateAllQuery(
      getSurveyDBSchema(surveyId),
      'node',
      { name: 'id', cast: 'int' },
      [
        { name: 'value', cast: 'jsonb' },
        { name: 'meta', cast: 'jsonb' },
        { name: 'date_modified', cast: 'timestamp' },
      ],
      values
    )
  )
}

// ============== DELETE
export const deleteNode = async (surveyId, nodeUuid, client = db) =>
  client.one(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE uuid = $1
    RETURNING *, true as ${Node.keys.deleted}
    `,
    [nodeUuid],
    dbTransformCallback
  )

export const deleteNodesByNodeDefUuids = async (surveyId, nodeDefUuids, client = db) =>
  client.manyOrNone(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE node_def_uuid IN ($1:csv)
    RETURNING *, true as ${Node.keys.deleted}
    `,
    [nodeDefUuids],
    dbTransformCallback
  )
