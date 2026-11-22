import { Dates, type ArenaRecordNode } from '@openforis/arena-core'

import { Schemata } from '@common/model/db'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import { RecordNodesCompactor } from '@core/record/_record/recordNodesCompactor'
import { RecordNodesHierarchy } from '@core/record/_record/recordNodesHierarchy'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import { isUuid } from '@core/uuid'

import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

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

// computed column with the node hierarchy (not stored in the db), moved into meta by dbTransformCallback
const hierarchyColumnName = 'hierarchy'

// ============== UTILS

// cache of camelized keys
const nodeKeyByColumnName: Record<string, string> = {}

const _toISOString = (date: unknown) => (date instanceof Date ? date.toISOString() : date)

const dbTransformCallback = (row: Record<string, unknown>): ArenaRecordNode => {
  // use a cache of camelized keys; "camelize" is too slow when running on thousands of objects
  // (do not camelize meta properties);
  // build a new object instead of deleting the row keys: "delete" would switch it to the (much bigger) V8 dictionary mode
  const node: Record<string, any> = {}
  for (const [columnName, value] of Object.entries(row)) {
    if (columnName === hierarchyColumnName) continue
    let nodeKey = nodeKeyByColumnName[columnName]
    if (!nodeKey) {
      nodeKey = A.camelize(columnName)
      nodeKeyByColumnName[columnName] = nodeKey
    }
    node[nodeKey] = value
  }
  // cast id to Number
  node.id = Number(node.id)
  // ISO strings (as in arena-core nodes) take much less memory than Date objects
  node.dateCreated = _toISOString(node.dateCreated)
  node.dateModified = _toISOString(node.dateModified)
  const hierarchy = row[hierarchyColumnName]
  if (hierarchy !== undefined) {
    node.meta = { ...node.meta, [Node.metaKeys.hierarchy]: hierarchy }
  }
  return node as ArenaRecordNode
}

// shares identical uuid strings and ref data objects among the fetched nodes (see RecordNodesCompactor)
const createDbTransformCallbackCompacting = () => {
  const compact = RecordNodesCompactor.createCompactor()
  return (row) => compact(dbTransformCallback(row))
}

const _toValueQueryParam = (value: unknown) => (value === null || A.isEmpty(value) ? null : JSON.stringify(value))

/**
 * Returns the SQL expression of the hierarchy (ancestor uuids, root first, as a jsonb array) of the node with the given alias,
 * following the parent uuids (one primary key lookup per level). Use it when fetching only some nodes of a record:
 * when fetching all of them, the hierarchy is rebuilt in memory (see RecordNodesHierarchy).
 * @param {!object} params - The parameters.
 * @param {!string} params.schema - The survey schema.
 * @param {string} [params.nodeAlias] - The alias of the node table.
 * @returns {string} - The SQL expression (a scalar subquery).
 */
const _getHierarchySelectField = ({ schema, nodeAlias = 'n' }: { schema: string; nodeAlias?: string }) =>
  `(WITH RECURSIVE ancestor AS (
      SELECT a.uuid, a.parent_uuid, 1 AS level FROM ${schema}.node a WHERE a.uuid = ${nodeAlias}.parent_uuid
      UNION ALL
      SELECT a.uuid, a.parent_uuid, ancestor.level + 1 FROM ${schema}.node a JOIN ancestor ON a.uuid = ancestor.parent_uuid
    )
    SELECT coalesce(jsonb_agg(ancestor.uuid ORDER BY ancestor.level DESC), '[]'::jsonb) FROM ancestor
  ) AS ${hierarchyColumnName}`

/**
 * Builds the select field and the joins to get the uuid of an ancestor of the selected nodes (n),
 * found going up by a number of levels that depends on the node definition (n.node_def_uuid).
 * @param {!object} params - The parameters.
 * @param {!string} params.schema - The survey schema.
 * @param {!object} params.ancestorLevelsByNodeDefUuid - Number of levels (>= 1) between the nodes and their ancestor, by node def uuid.
 * @returns {{field: string, joins: string[]}} - The select field and the joins.
 */
const _getAncestorUuidSelect = ({
  schema,
  ancestorLevelsByNodeDefUuid,
}: {
  schema: string
  ancestorLevelsByNodeDefUuid: Record<string, number>
}): { field: string; joins: string[] } => {
  const nodeDefUuidsByLevels = new Map<number, string[]>()
  for (const [nodeDefUuid, levels] of Object.entries(ancestorLevelsByNodeDefUuid)) {
    if (!isUuid(nodeDefUuid)) throw new Error(`Invalid node def uuid: ${nodeDefUuid}`)
    if (levels < 1) continue
    nodeDefUuidsByLevels.set(levels, [...(nodeDefUuidsByLevels.get(levels) ?? []), nodeDefUuid])
  }
  if (nodeDefUuidsByLevels.size === 0) {
    return { field: 'NULL::uuid', joins: [] }
  }
  const maxLevels = Math.max(...nodeDefUuidsByLevels.keys())
  // a{k} is the ancestor of n k levels above it
  const joins = []
  for (let k = 1; k < maxLevels; k++) {
    joins.push(`LEFT JOIN ${schema}.node a${k} ON a${k}.uuid = ${k === 1 ? 'n' : `a${k - 1}`}.parent_uuid`)
  }
  const getAncestorUuid = (levels: number) => (levels === 1 ? 'n.parent_uuid' : `a${levels - 1}.parent_uuid`)
  if (nodeDefUuidsByLevels.size === 1) {
    return { field: getAncestorUuid(maxLevels), joins }
  }
  const cases = [...nodeDefUuidsByLevels.entries()].map(
    ([levels, nodeDefUuids]) =>
      `WHEN n.node_def_uuid IN (${nodeDefUuids.map((uuid) => `'${uuid}'`).join(', ')}) THEN ${getAncestorUuid(levels)}`
  )
  return { field: `CASE ${cases.join(' ')} END`, joins }
}

/**
 * It builds the node select query.
 * @param {!object} params - The parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {boolean} [params.includeRefData] - If true, category item and taxon item associated to the node value will be fetched.
 * @param {boolean} [params.includeRecordUuid] - If true, the record uuid will be included in the fetch (useful when selecting by record_uuid to make the query faster).
 * @param {boolean} [params.includeSurveyUuid] - If true, the survey uuid will be included in the fetch (useful when selecting by survey_uuid to make the query faster).
 * @param {boolean} [params.includeRecordInfo] - If true, record info will be included in the fetch.
 * @param {object} [params.ancestorLevelsByNodeDefUuid] - Used with includeRecordInfo to populate the ancestorUuid field: number of levels between the nodes and their ancestor, by node def uuid.
 * @param {boolean} [params.includeHierarchy] - If true, the node hierarchy (not stored in the db) will be computed in the query (see _getHierarchySelectField).
 * @param {boolean} [params.draft] - If true, draft category and taxonomy item props will be fetched, otherwise only published props.
 * @returns {string} - The SQL SELECT query for fetching nodes.
 */
export const getNodeSelectQuery = ({
  surveyId,
  includeRefData = true,
  includeRecordUuid = true,
  includeRecordInfo = false,
  includeSurveyUuid = true,
  ancestorLevelsByNodeDefUuid = {},
  includeHierarchy = false,
  draft = true,
}: {
  surveyId: number
  includeRefData?: boolean
  includeRecordUuid?: boolean
  includeRecordInfo?: boolean
  includeSurveyUuid?: boolean
  ancestorLevelsByNodeDefUuid?: Record<string, number>
  includeHierarchy?: boolean
  draft?: boolean
}) => {
  const schema = Schemata.getSchemaSurvey(surveyId)

  const selectFields = (includeRecordUuid ? tableColumnsSelect : A.without(['record_uuid'], tableColumnsSelect)).map(
    (field) => `n.${field}`
  )

  const fromParts = [`${schema}.node n`]
  if (includeHierarchy) {
    selectFields.push(_getHierarchySelectField({ schema }))
  }
  if (includeSurveyUuid) {
    selectFields.push('si.survey_uuid')
    fromParts.push(`CROSS JOIN survey_info si`)
  }

  if (includeRecordInfo) {
    const ancestorUuidSelect = _getAncestorUuidSelect({ schema, ancestorLevelsByNodeDefUuid })
    selectFields.push(
      'r.cycle AS record_cycle',
      'r.step AS record_step',
      'r.owner_uuid AS record_owner_uuid',
      `${ancestorUuidSelect.field} AS ancestor_uuid`
    )
    fromParts.push(`JOIN ${schema}.record r 
      ON r.uuid = n.record_uuid
      -- exclude merged records
      AND r.merged_into_record_uuid IS NULL`)
    fromParts.push(...ancestorUuidSelect.joins)
  }

  if (includeRefData) {
    // include ref data (category items, taxa, etc.)

    const propsTaxon = DbUtils.getPropsCombined(draft, 't.', null)
    const propsVernacularName = DbUtils.getPropsCombined(draft, 'v.', null)
    const propsCategoryItem = DbUtils.getPropsCombined(draft, 'c.', null)

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

export const countNodesWithMissingFile = (
  {
    surveyId,
    nodeDefFileUuids,
    recordUuid = null,
  }: { surveyId: number; nodeDefFileUuids: string[]; recordUuid?: string },
  client: DbClient = db
) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const whereConditions = [
    `n.node_def_uuid IN ($/nodeDefFileUuids:csv/)`,
    `n.value IS NOT NULL`,
    `n.value->>'${Node.valuePropsFile.fileUuid}' IS NOT NULL`,
    `NOT EXISTS (SELECT 1 FROM ${schema}.file f WHERE f.uuid = (n.value->>'${Node.valuePropsFile.fileUuid}')::uuid)`,
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

/**
 * Counts the file attribute nodes whose file is missing, for each of the specified records.
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string[]} params.nodeDefFileUuids - The uuids of the file attribute definitions.
 * @param {!string[]} params.recordUuids - The uuids of the records.
 * @param {object} [client] - The database client.
 * @returns {Promise<object>} - Counts indexed by record uuid (only records with missing files).
 */
export const countNodesWithMissingFileByRecordUuids = async (
  { surveyId, nodeDefFileUuids, recordUuids }: { surveyId: number; nodeDefFileUuids: string[]; recordUuids: string[] },
  client: DbClient = db
) => {
  if (nodeDefFileUuids.length === 0 || recordUuids.length === 0) return {}
  const schema = Schemata.getSchemaSurvey(surveyId)
  const rows = await client.any(
    `SELECT n.record_uuid, COUNT(n.*)
    FROM ${schema}.node n
    WHERE n.node_def_uuid IN ($/nodeDefFileUuids:csv/)
      AND n.record_uuid IN ($/recordUuids:csv/)
      AND n.value->>'${Node.valuePropsFile.fileUuid}' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM ${schema}.file f WHERE f.uuid = (n.value->>'${Node.valuePropsFile.fileUuid}')::uuid)
    GROUP BY n.record_uuid`,
    { nodeDefFileUuids, recordUuids }
  )
  return Object.fromEntries(rows.map((row) => [row.record_uuid, Number(row.count)]))
}

/**
 * Finds file-attribute-value nodes belonging to PREVIEW records only, that either have one of the
 * given node def UUIDs themselves, or are descendants of a node that does (found going down the
 * parent uuids with a recursive query).
 * Used by deleteNodesByNodeDefUuids, whose delete is NOT scoped to a single record (it can affect
 * nodes - and therefore files - across many records of the survey at once), which is why this needs
 * a DB-wide query rather than filtering an in-memory record's nodes.
 * Must be called BEFORE the node delete, since ON DELETE CASCADE silently removes descendant
 * rows with no RETURNING visibility.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey ID.
 * @param {Array<string>} params.nodeDefUuids - Node def UUIDs being purged wholesale.
 * @param {DbClient} [client] - The database client.
 * @returns {Promise<Array<{fileUuid: string, recordUuid: string}>>} - The matching file-attribute nodes.
 */
export const fetchFileValueNodesByNodeDefUuids = (
  { surveyId, nodeDefUuids }: { surveyId: number; nodeDefUuids: string[] },
  client: DbClient = db
) => {
  if (A.isEmpty(nodeDefUuids)) return []

  const schema = Schemata.getSchemaSurvey(surveyId)

  // UNION (not UNION ALL) visits once the nodes found both as roots and as descendants of other roots
  return client.manyOrNone(
    `
    WITH RECURSIVE subtree AS (
      SELECT n.uuid, n.record_uuid, n.node_def_uuid, n.value
      FROM ${schema}.node n
      JOIN ${schema}.record r ON r.uuid = n.record_uuid AND r.preview = true
      WHERE n.node_def_uuid IN ($/nodeDefUuids:csv/)
      UNION
      SELECT c.uuid, c.record_uuid, c.node_def_uuid, c.value
      FROM ${schema}.node c
      JOIN subtree ON c.parent_uuid = subtree.uuid
    )
    SELECT n.record_uuid AS "recordUuid", n.value ->> '${Node.valuePropsFile.fileUuid}' AS "fileUuid"
    FROM subtree n
    JOIN ${schema}.node_def nd ON nd.uuid = n.node_def_uuid AND nd.type = '${NodeDef.nodeDefType.file}'
    WHERE n.value ->> '${Node.valuePropsFile.fileUuid}' IS NOT NULL`,
    { nodeDefUuids }
  )
}

// ============== CREATE

export const insertNode = async (surveyId: number, node: ArenaRecordNode, draft: boolean, client: DbClient = db) => {
  // items with default values (e.g. empty child applicability) and the hierarchy are not stored to save space
  const meta = Node.toStoredMeta(Node.getMeta(node))

  await client.query(
    `
    INSERT INTO ${Schemata.getSchemaSurvey(surveyId)}.node
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

export const insertNodesFromValues = (surveyId: number, nodeValues: any, client: DbClient = db) =>
  client.none(DbUtils.insertAllQuery(Schemata.getSchemaSurvey(surveyId), 'node', tableColumnsInsert, nodeValues))

export const insertNodesInBatch = async (
  { surveyId, nodes = [] }: { surveyId: number; nodes?: ArenaRecordNode[] },
  client: DbClient = db
) => {
  if (nodes.length === 0) return []

  const query = DbUtils.insertAllQueryBatch(
    Schemata.getSchemaSurvey(surveyId),
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
      meta: Node.toStoredMeta(Node.getMeta(node)),
    }))
  )
  // Passing no parameters (rather than []) tells pg-promise to send the query as-is: `query` was
  // already built with every value embedded as a literal (see DbUtils.insertAllQueryBatch above),
  // so re-running it through pg-promise's own $N parameter substitution - which scans the raw SQL
  // text for "$" followed by digits, even inside string/JSON literals - would misinterpret a node
  // value like "It costs $90" as a placeholder reference and throw "Variable $90 out of range".
  await client.map(query + ' RETURNING id', undefined, (row, index) => (nodes[index].id = row.id))
  return nodes
}

// ============== READ

export const fetchNodesByRecordUuid = async (
  {
    surveyId,
    recordUuid,
    includeRefData = true,
    includeSurveyUuid = true,
    includeRecordUuid = true,
    draft = true,
  }: {
    surveyId: number
    recordUuid: string
    includeRefData?: boolean
    includeSurveyUuid?: boolean
    includeRecordUuid?: boolean
    draft?: boolean
  },
  client: DbClient = db
) =>
  RecordNodesHierarchy.assocHierarchies(
    await client.map(
      `${getNodeSelectQuery({ surveyId, includeRefData, includeSurveyUuid, includeRecordUuid, draft })}
      WHERE n.record_uuid = $/recordUuid/
      ORDER BY n.date_created`,
      { surveyId, recordUuid },
      createDbTransformCallbackCompacting()
    )
  )

export const fetchNodeByUuid = (surveyId: number, uuid: string, client: DbClient = db) =>
  client.one(
    `
    SELECT n.*, ${_getHierarchySelectField({ schema: Schemata.getSchemaSurvey(surveyId) })}
    FROM ${Schemata.getSchemaSurvey(surveyId)}.node n
    WHERE n.uuid = $1`,
    [uuid],
    dbTransformCallback
  )

// Returns the uuid of the record owning the node, or null when the node does not exist.
export const fetchNodeRecordUuid = (surveyId: number, uuid: string, client: DbClient = db): Promise<string | null> =>
  client.oneOrNone(
    `
    SELECT record_uuid FROM ${Schemata.getSchemaSurvey(surveyId)}.node
    WHERE uuid = $1`,
    [uuid],
    (row) => row?.record_uuid ?? null
  )

export const fetchNodesWithRefDataByUuids = (
  { surveyId, nodeUuids, draft }: { surveyId: number; nodeUuids: string[]; draft: boolean },
  client: DbClient = db
) =>
  client.map(
    `
    ${getNodeSelectQuery({ surveyId, draft, includeHierarchy: true })}
    WHERE n.uuid IN ($/nodeUuids:list/)
  `,
    { surveyId, nodeUuids },
    createDbTransformCallbackCompacting()
  )

export const fetchNodeWithRefDataByUuid = async (
  { surveyId, nodeUuid, draft }: { surveyId: number; nodeUuid: string; draft: boolean },
  client: DbClient = db
) => (await fetchNodesWithRefDataByUuids({ surveyId, nodeUuids: [nodeUuid], draft }, client))[0]

export const fetchChildNodesByNodeDefUuids = (
  surveyId: number,
  recordUuid: string,
  nodeUuid: string,
  childDefUuids: string[],
  client: DbClient = db
) =>
  client.map(
    `
    ${getNodeSelectQuery({ surveyId, draft: false, includeHierarchy: true })}
    WHERE n.record_uuid = $/recordUuid/
      AND n.parent_uuid ${nodeUuid ? '= $/nodeUuid/' : 'is null'}
      AND n.node_def_uuid IN ($/childDefUuids:csv/)`,
    { surveyId, recordUuid, nodeUuid, childDefUuids },
    createDbTransformCallbackCompacting()
  )

// ============== UPDATE
export const updateNode = async (
  {
    surveyId,
    nodeUuid,
    value = null,
    meta = {},
    draft,
    reloadNode = true,
  }: {
    surveyId: number
    nodeUuid: string
    value?: unknown
    meta?: Record<string, any>
    draft: boolean
    reloadNode?: boolean
  },
  client: DbClient = db
) => {
  // meta is merged into the stored one: items with default values and the hierarchy are deleted instead of stored, to save space
  await client.query(
    `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.node
    SET value = $1::jsonb,
    meta = (meta - $4::text[]) || $2::jsonb, 
    date_modified = ${DbUtils.now}
    WHERE uuid = $3
    `,
    [_toValueQueryParam(value), Node.toStoredMeta(meta), nodeUuid, Node.getStoredMetaKeysToDelete(meta)]
  )
  if (!reloadNode) return null

  // fetch node with ref data
  const node = await fetchNodeWithRefDataByUuid({ surveyId, nodeUuid, draft }, client)
  node[Node.keys.updated] = true
  return node
}

export const updateNodes = async (
  { surveyId, nodes }: { surveyId: number; nodes: ArenaRecordNode[] },
  client: DbClient = db
) => {
  const values = nodes.map((node) => [
    Node.getId(node),
    _toValueQueryParam(Node.getValue(node)),
    // meta is replaced as a whole: items with default values and the hierarchy are not stored to save space
    Node.toStoredMeta(Node.getMeta(node)),
    Dates.formatForStorage(Node.getDateModified(node)),
  ])
  await client.none(
    DbUtils.updateAllQuery(
      Schemata.getSchemaSurvey(surveyId),
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
export const deleteNode = (surveyId: number, nodeUuid: string, client: DbClient = db) =>
  client.one(
    `
    DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.node n
    WHERE n.uuid = $1
    RETURNING n.*, ${_getHierarchySelectField({ schema: Schemata.getSchemaSurvey(surveyId) })}, true as ${Node.keys.deleted}
    `,
    [nodeUuid],
    dbTransformCallback
  )

/**
 * Deletes all nodes belonging to the given node def uuids, survey-wide. Callers of this delete
 * are cleaning up nodes for node defs that no longer exist (e.g. RecordCheckJob, at publish time),
 * not tracking individual affected nodes, so this intentionally skips RETURNING: on a large survey
 * this delete can match millions of rows, and pulling them all back (with their JSONB value/meta
 * payloads) into memory at once is enough on its own to exhaust a job worker's heap.
 * @param {number} surveyId - The survey ID.
 * @param {Array<string>} nodeDefUuids - Node def UUIDs being purged wholesale.
 * @param {DbClient} [client] - The database client.
 * @returns {Promise<number>} - The number of nodes deleted.
 */
export const deleteNodesByNodeDefUuids = (surveyId: number, nodeDefUuids: string[], client: DbClient = db) =>
  client.result(
    `
    DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.node
    WHERE node_def_uuid IN ($1:csv)
    `,
    [nodeDefUuids],
    A.prop('rowCount')
  )

export const deleteNodesByUuids = (surveyId: number, nodeUuids: string[], client: DbClient = db) =>
  client.map(
    // the hierarchy subquery still sees the ancestors deleted by the same statement (statement snapshot)
    `DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.node n
    WHERE n.uuid IN ($1:csv)
    RETURNING n.*, ${_getHierarchySelectField({ schema: Schemata.getSchemaSurvey(surveyId) })}, true as ${Node.keys.deleted}`,
    [nodeUuids],
    dbTransformCallback
  )

// ============== MAINTENANCE

/**
 * Rewrites the node table of the specified survey reclaiming the space of dead rows (it locks the table while running).
 * It cannot be run inside a transaction.
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey ID.
 * @param {DbClient} [client] - The database client (not a transaction).
 * @returns {Promise<null>} - The query result.
 */
export const vacuumFullNodeTable = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  DbUtils.vacuumTable({ schema: Schemata.getSchemaSurvey(surveyId), table: 'node', full: true, analyze: true }, client)
