import * as R from 'ramda'

import { Dates } from '@openforis/arena-core'

import { Schemata } from '@common/model/db'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

const { keys: refDataKeys } = NodeRefData
const { keys: categoryItemKeys } = CategoryItem
const { keys: taxonKeys } = Taxon

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

// cache of camelized keys
const nodeKeyByColumnName = {}

const dbTransformCallback = (node) => {
  // use a cache of camelized keys; "camelize" is too slow when running on thousands of objects
  // (do not camelize meta properties)
  for (const [columnName, value] of Object.entries(node)) {
    const nodeKey = nodeKeyByColumnName[columnName] ?? A.camelize(columnName)
    if (nodeKey !== columnName) {
      node[nodeKey] = value
      delete node[columnName]
    }
  }
  // cast id to Number
  node.id = Number(node.id)
  return node
}

const _toValueQueryParam = (value) => (value === null || A.isEmpty(value) ? null : JSON.stringify(value))

const _getAncestorUuidSelectField = (ancestorDef) => {
  const nodeAncestorEntityHierarchyIndex = ancestorDef ? NodeDef.getMetaHierarchy(ancestorDef).length : null
  return nodeAncestorEntityHierarchyIndex === null
    ? 'null'
    : `(n.meta -> '${Node.metaKeys.hierarchy}' ->> ${nodeAncestorEntityHierarchyIndex})::uuid`
}

/**
 * It builds the node select query.
 * @param {!object} params - The parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {boolean} [params.includeRefData] - If true, category item and taxon item associated to the node value will be fetched.
 * @param {boolean} [params.includeRecordUuid] - If true, the record uuid will be included in the fetch (useful when selecting by record_uuid to make the query faster).
 * @param {boolean} [params.includeSurveyUuid] - If true, the survey uuid will be included in the fetch (useful when selecting by survey_uuid to make the query faster).
 * @param {boolean} [params.includeRecordInfo] - If true, record info will be included in the fetch.
 * @param {object|null} [params.ancestorDef] - Ancestor entity definition used to populate the ancestorUuid field with the corresponding value in the node meta hierarchy.
 * @param {boolean} [params.draft] - If true, draft category and taxonomy item props will be fetched, otherwise only published props.
 * @returns {string} - The SQL SELECT query for fetching nodes.
 */
export const getNodeSelectQuery = ({
  surveyId,
  includeRefData = true,
  includeRecordUuid = true,
  includeRecordInfo = false,
  includeSurveyUuid = true,
  ancestorDef = null,
  draft = true,
}) => {
  const schema = getSurveyDBSchema(surveyId)

  const selectFields = (includeRecordUuid ? tableColumnsSelect : R.without(['record_uuid'], tableColumnsSelect)).map(
    (field) => `n.${field}`
  )

  const fromParts = [`${schema}.node n`]
  if (includeSurveyUuid) {
    selectFields.push('si.survey_uuid')
    fromParts.push(`CROSS JOIN survey_info si`)
  }

  if (includeRecordInfo) {
    selectFields.push(
      'r.cycle AS record_cycle',
      'r.step AS record_step',
      'r.owner_uuid AS record_owner_uuid',
      `${_getAncestorUuidSelectField(ancestorDef)} AS ancestor_uuid`
    )
    fromParts.push(`JOIN ${schema}.record r 
      ON r.uuid = n.record_uuid
      -- exclude merged records
      AND r.merged_into_record_uuid IS NULL`)
  }

  if (includeRefData) {
    // include ref data (category items, taxa, etc.)

    const propsTaxon = DbUtils.getPropsCombined(draft, 't.', false)
    const propsVernacularName = DbUtils.getPropsCombined(draft, 'v.', false)
    const propsCategoryItem = DbUtils.getPropsCombined(draft, 'c.', false)

    selectFields.push(
      ` CASE
          WHEN val_taxon IS NOT NULL
          THEN json_build_object('${refDataKeys.taxon}', json_build_object('id',t.id, 'uuid',t.uuid, '${taxonKeys.taxonomyUuid}',t.taxonomy_uuid, 'props',${propsTaxon}, '${taxonKeys.vernacularNameUuid}',v.uuid, '${taxonKeys.vernacularLanguage}',(${propsVernacularName})->>'lang', '${taxonKeys.vernacularName}', (${propsVernacularName})->>'name') )
          WHEN val_item IS NOT NULL
          THEN json_build_object('${refDataKeys.categoryItem}', json_build_object('id',c.id, 'uuid', c.uuid, '${categoryItemKeys.levelUuid}', c.level_uuid, '${categoryItemKeys.parentUuid}', c.parent_uuid, 'props',${propsCategoryItem}) )
          ELSE NULL
      END AS ref_data`
    )
    fromParts.push(`
      -- Extracting the UUIDs once in the LATERAL join to avoid repeating JSON logic
      LEFT JOIN LATERAL (SELECT (n.value ->> '${Node.valuePropsCode.itemUuid}')::uuid AS val_item) vi ON TRUE
      LEFT JOIN LATERAL (SELECT (n.value ->> '${Node.valuePropsTaxon.taxonUuid}')::uuid AS val_taxon) vt ON TRUE
      LEFT JOIN LATERAL (SELECT (n.value ->> '${Node.valuePropsTaxon.vernacularNameUuid}')::uuid AS val_vernacular) vv ON TRUE
      -- Now join using the pre-extracted UUIDs
      LEFT JOIN ${schema}.category_item c ON c.uuid = vi.val_item
      LEFT JOIN ${schema}.taxon t ON t.uuid = vt.val_taxon
      LEFT JOIN ${schema}.taxon_vernacular_name v ON v.uuid = vv.val_vernacular
    `)
  }

  const surveyInfoQuery = `WITH survey_info AS (
    SELECT uuid AS survey_uuid 
    FROM survey 
    WHERE id = $/surveyId/ 
    LIMIT 1
  )`

  return `${includeSurveyUuid ? surveyInfoQuery : ''}
  SELECT ${selectFields.join(', ')} FROM ${fromParts.join(' ')}`
}

export const countNodesWithMissingFile = async ({ surveyId, nodeDefFileUuids, recordUuid = null }, client = db) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const whereConditions = [
    `n.node_def_uuid IN ($/nodeDefFileUuids:csv/)`,
    `n.value IS NOT NULL`,
    `(n.value->>'${Node.valuePropsFile.fileUuid}')::uuid NOT IN (SELECT uuid FROM ${schema}.file)`,
  ]
  if (recordUuid) {
    whereConditions.push(`n.record_uuid = $/recordUuid/`)
  }
  const whereClause = DbUtils.getWhereClause(...whereConditions)
  return client.one(
    `SELECT COUNT(n.*) 
    FROM ${schema}.node n
    ${whereClause}`,
    { recordUuid, nodeDefFileUuids },
    (row) => Number(row.count)
  )
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
      date_created: Dates.formatForStorage(Node.getDateCreated(node)),
      date_modified: Dates.formatForStorage(Node.getDateModified(node)),
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
  { surveyId, recordUuid, includeRefData = true, includeSurveyUuid = true, includeRecordUuid = true, draft = true },
  client = db
) =>
  client.map(
    `${getNodeSelectQuery({ surveyId, includeRefData, includeSurveyUuid, includeRecordUuid, draft })}
    WHERE n.record_uuid = $/recordUuid/
    ORDER BY n.date_created`,
    { surveyId, recordUuid },
    dbTransformCallback
  )

export const fetchNodeByIId = async (surveyId, recordUuid, iId, client = db) =>
  client.one(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE record_uuid = $/recordUuid/ AND iid = $/iId/`,
    { recordUuid, iId },
    dbTransformCallback
  )

export const fetchNodesWithRefDataByUuids = async ({ surveyId, nodeUuids, draft }, client = db) =>
  client.map(
    `
    ${getNodeSelectQuery({ surveyId, draft })}
    WHERE n.uuid IN ($/nodeUuids:list/)
  `,
    { surveyId, nodeUuids },
    dbTransformCallback
  )

export const fetchNodeWithRefDataByUuid = async ({ surveyId, nodeUuid, draft }, client = db) =>
  (await fetchNodesWithRefDataByUuids({ surveyId, nodeUuids: [nodeUuid], draft }, client))[0]

export const fetchChildNodesByNodeDefUuids = async (surveyId, recordUuid, nodeUuid, childDefUuids, client = db) =>
  client.map(
    `
    ${getNodeSelectQuery({ surveyId, draft: false })}
    WHERE n.record_uuid = $/recordUuid/
      AND n.parent_uuid ${nodeUuid ? '= $/nodeUuid/' : 'is null'}
      AND n.node_def_uuid IN ($/childDefUuids:csv/)`,
    { surveyId, recordUuid, nodeUuid, childDefUuids },
    dbTransformCallback
  )

// ============== UPDATE
export const updateNode = async (
  { surveyId, nodeIId, value = null, meta = {}, draft, reloadNode = true },
  client = db
) => {
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node
    SET value = $1::jsonb,
    meta = meta || $2::jsonb, 
    date_modified = ${DbUtils.now}
    WHERE iid = $3
    `,
    [_toValueQueryParam(value), meta || {}, nodeIId]
  )
  if (!reloadNode) return null

  // fetch node with ref data
  // TODO
  const recordUuid = null
  const node = await fetchNodeWithRefDataByUuid({ surveyId, recordUuid, nodeIId, draft }, client)
  node[Node.keys.updated] = true
  return node
}

export const updateNodes = async ({ surveyId, nodes }, client = db) => {
  const values = nodes.map((node) => [
    Node.getId(node),
    _toValueQueryParam(Node.getValue(node)),
    Node.getMeta(node),
    Dates.formatForStorage(Node.getDateModified(node)),
  ])
  await client.none(
    DbUtils.updateAllQuery(
      getSurveyDBSchema(surveyId),
      'node',
      { name: 'id', cast: 'bigint' },
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

export const deleteNodesByInternalIds = async (surveyId, nodeInternalIds, client = db) =>
  client.manyOrNone(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.node
    WHERE iid IN ($1:csv)
    RETURNING *, true as ${Node.keys.deleted}`,
    [nodeInternalIds],
    dbTransformCallback
  )
