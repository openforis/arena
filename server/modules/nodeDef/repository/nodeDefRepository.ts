import type { DbClient } from '@server/db/db'
import type { ArenaAnyNodeDef, ArenaNodeDefMeta, ArenaNodeDefPropsAdvanced } from '@openforis/arena-core'
import { Objects } from '@openforis/arena-core'
import { DB, TableNodeDef, Schemata, NodeDefRepository as NodeDefRepositoryServer } from '@openforis/arena-server'

import * as NodeDef from '@core/survey/nodeDef'
import { userDependentFunctionNames } from '@core/expressionParser/helpers/functions'
import * as DbUtils from '@server/db/dbUtils'

import { checkNodeDef, checkNodeDefProps, checkNodeDefType } from './nodeDefWriteCheck'

const { getSchemaSurvey } = Schemata

const dbTransformCallback = ({
  row,
  draft,
  advanced = false,
  backup = false,
}: {
  row: { [column: string]: unknown }
  draft: boolean
  advanced?: boolean
  backup?: boolean
}) => NodeDefRepositoryServer.rowTransformCallback({ draft, advanced, backup })(row)

const nodeDefSelectFields = `id, uuid, parent_uuid, type, deleted, analysis, virtual, 
  ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

export const insertNodeDef = async (surveyId: number, nodeDef: ArenaAnyNodeDef, client: DbClient = DB) => {
  checkNodeDef(nodeDef)
  return await client.one(
    `
    INSERT INTO ${getSchemaSurvey(surveyId)}.node_def 
      (parent_uuid, uuid, type, props_draft, props_advanced_draft, meta, analysis, virtual)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      NodeDef.getParentUuid(nodeDef),
      NodeDef.getUuid(nodeDef),
      NodeDef.getType(nodeDef),
      NodeDef.getProps(nodeDef),
      NodeDef.getPropsAdvanced(nodeDef),
      NodeDef.getMeta(nodeDef),
      NodeDef.isAnalysis(nodeDef),
      NodeDef.isVirtual(nodeDef),
    ],
    (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when creating or updating a nodeDef
  )
}

export const insertNodeDefsBatch = async (
  { surveyId, nodeDefs, backup = false }: { surveyId: number; nodeDefs: ArenaAnyNodeDef[]; backup?: boolean },
  client: DbClient = DB
) => {
  for (const nodeDef of nodeDefs) {
    checkNodeDef(nodeDef)
  }
  const schema = getSchemaSurvey(surveyId)
  // Build values and query for batch insert with RETURNING *
  const columns = [
    'parent_uuid',
    'uuid',
    'type',
    'props',
    'props_draft',
    'props_advanced',
    'props_advanced_draft',
    'meta',
    'analysis',
    'virtual',
  ]
  const values = nodeDefs.map((nodeDef) => {
    const { props, propsDraft, propsAdvanced, propsAdvancedDraft } = NodeDef.getAllPropsAndAllPropsDraft({
      backup,
    })(nodeDef)
    return [
      NodeDef.getParentUuid(nodeDef),
      nodeDef.uuid,
      NodeDef.getType(nodeDef),
      props,
      propsDraft,
      propsAdvanced,
      propsAdvancedDraft,
      NodeDef.getMeta(nodeDef),
      NodeDef.isAnalysis(nodeDef),
      NodeDef.isVirtual(nodeDef),
    ]
  })
  // Build parameterized query
  const valuePlaceholders = values
    .map((row, rowIdx) => {
      const rowPlaceholders = row
        .map((_, colIdx) => {
          const placeholderIdx = rowIdx * columns.length + colIdx + 1
          return `$${placeholderIdx}`
        })
        .join(', ')
      return `(${rowPlaceholders})`
    })
    .join(', ')
  const query = `
    INSERT INTO ${schema}.node_def
      (${columns.join(', ')})
    VALUES ${valuePlaceholders}
    RETURNING *`
  const flatValues = values.flat()

  return await client.map(query, flatValues, (row) => dbTransformCallback({ row, draft: true, advanced: true }))
}

// ============== READ

export const countNodeDefsBySurveyId = (
  { surveyId, draft = true }: { surveyId: number; draft?: boolean },
  client: DbClient = DB
) =>
  client.one(
    `
    SELECT COUNT(*)
    FROM ${getSchemaSurvey(surveyId)}.node_def
    WHERE TRUE
    ${!draft ? " AND props <> '{}'::jsonb" : ''}`,
    {},
    (row) => Number(row.count)
  )

// Lightweight alternative to fetchNodeDefsBySurveyId when only the uuids of file node defs are needed
// (e.g. to check for missing files), avoiding fetching and transforming full node def rows.
export const fetchFileNodeDefUuidsBySurveyId = ({ surveyId }: { surveyId: number }, client: DbClient = DB) =>
  client.map(
    `
    SELECT uuid
    FROM ${getSchemaSurvey(surveyId)}.node_def
    WHERE type = $/type/
    AND NOT deleted`,
    { type: NodeDef.nodeDefType.file },
    (row) => row.uuid
  )

// Cheap survey-level check for whether any node def expression references a function whose
// result depends on the currently logged in user (e.g. userProp).
// By default, only published (props_advanced) expressions are checked; pass draft = true to
// also consider draft (props_advanced_draft) expressions.
export const fetchSurveyHasUserDependentExpressions = async (
  { surveyId, draft = false }: { surveyId: number; draft?: boolean },
  client: DbClient = DB
) => {
  const functionsPattern = userDependentFunctionNames.join('|')
  const propsAdvancedExpr = draft ? '(props_advanced || props_advanced_draft)' : 'props_advanced'
  const { exists } = await client.one(String.raw`
    SELECT EXISTS (
      SELECT 1 FROM ${getSchemaSurvey(surveyId)}.node_def
      WHERE deleted = false
        AND (${propsAdvancedExpr})::text ~ '\y(${functionsPattern})\s*\('
    ) AS exists
  `)
  return exists
}

export const fetchNodeDefsBySurveyId = (
  {
    surveyId,
    cycle,
    draft,
    advanced = false,
    includeDeleted = false,
    backup = false,
    includeAnalysis = true,
  }: {
    surveyId: number
    cycle: string
    draft: boolean
    advanced?: boolean
    includeDeleted?: boolean
    backup?: boolean
    includeAnalysis?: boolean
  },
  client: DbClient = DB
) =>
  NodeDefRepositoryServer.getNodeDefsBySurveyId(
    {
      surveyId,
      cycle,
      draft,
      advanced,
      includeAnalysis,
      includeDeleted,
      backup,
    },
    // arena-server types the client as a connection pool, but it accepts tasks and transactions too
    client as Parameters<typeof NodeDefRepositoryServer.getNodeDefsBySurveyId>[1]
  )

export const fetchRootNodeDef = (surveyId: number, draft: boolean, client: DbClient = DB) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSchemaSurvey(surveyId)}.node_def 
     WHERE parent_uuid IS NULL`,
    [],
    (row) => dbTransformCallback({ row, draft })
  )

export const fetchNodeDefByUuid = (
  surveyId: number,
  nodeDefUuid: string,
  draft: boolean,
  advanced = false,
  client: DbClient = DB
) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSchemaSurvey(surveyId)}.node_def 
     WHERE uuid = $1`,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft, advanced })
  )

const fetchNodeDefsByParentUuid = (surveyId: number, parentUuid: string, draft: boolean, client: DbClient = DB) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSchemaSurvey(surveyId)}.node_def 
    WHERE parent_uuid = $1
    AND deleted IS NOT TRUE
    ORDER BY id`,
    [parentUuid],
    (row) => dbTransformCallback({ row, draft })
  )

const fetchAreaBasedEstimateNodeDefsOf = (
  surveyId: number,
  nodeDefUuid: string,
  draft: boolean,
  client: DbClient = DB
) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSchemaSurvey(surveyId)}.node_def 
    WHERE 
    (props_advanced || props_advanced_draft) ->> '${NodeDef.keysPropsAdvanced.areaBasedEstimatedOf}' = $1
    AND deleted IS NOT TRUE`,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft })
  )

// ============== UPDATE

export const updateNodeDefProps = async (
  {
    surveyId,
    nodeDefUuid,
    parentUuid,
    props = {},
    propsAdvanced = {},
    meta = {},
  }: {
    surveyId: number
    nodeDefUuid: string
    parentUuid: string
    props?: Record<string, any>
    propsAdvanced?: ArenaNodeDefPropsAdvanced
    meta?: Partial<ArenaNodeDefMeta>
  },
  client: DbClient = DB
) => {
  checkNodeDefProps(props)
  return await client.one(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def 
    SET props_draft = props_draft || $1::jsonb,
        props_advanced_draft = props_advanced_draft || $2::jsonb,
        parent_uuid = $3,
        meta = meta || $4::jsonb,
        date_modified = ${DbUtils.now}
    WHERE uuid = $5
    RETURNING ${nodeDefSelectFields}
  `,
    [props, propsAdvanced, parentUuid, meta, nodeDefUuid],
    (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when updating a nodeDef
  )
}

// props of a node def to update
export type NodeDefPropsUpdate = {
  nodeDefUuid: string
  props?: Record<string, unknown>
  propsAdvanced?: Record<string, unknown>
}

export const updateNodeDefPropsInBatch = async (
  { surveyId, nodeDefs }: { surveyId: number; nodeDefs: NodeDefPropsUpdate[] },
  client: DbClient = DB
) => {
  for (const { props } of nodeDefs) {
    checkNodeDefProps(props)
  }
  return await client.tx(async (tx) => {
    const schema = getSchemaSurvey(surveyId)
    const nodeDefsUpdated = await DbUtils.runQueries(
      tx,
      nodeDefs.map((nodeDef) => () => {
        const { nodeDefUuid, props = {}, propsAdvanced = {} } = nodeDef
        return tx.one(
          `
        UPDATE ${schema}.node_def 
        SET 
        props_draft = props_draft || $2::jsonb,
        props_advanced_draft = props_advanced_draft || $3::jsonb,
        
        date_modified = ${DbUtils.now}
    WHERE uuid = $1
    RETURNING *`,
          [nodeDefUuid, props, propsAdvanced],
          (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when updating a nodeDef
        )
      })
    )
    return nodeDefsUpdated
  })
}

export const updateNodeDefType = async (
  { surveyId, nodeDefUuid, type }: { surveyId: number; nodeDefUuid: string; type: string },
  client: DbClient = DB
) => {
  checkNodeDefType(type)
  return await client.none(
    `UPDATE ${getSchemaSurvey(surveyId)}.node_def SET type = $1, date_modified = ${DbUtils.now} WHERE uuid = $2`,
    [type, nodeDefUuid]
  )
}

export const updateNodeDefTypeAndProps = async (
  {
    surveyId,
    nodeDefUuid,
    type,
    props = {},
    propsAdvanced = {},
  }: {
    surveyId: number
    nodeDefUuid: string
    // validated by checkNodeDefType
    type: string
    props?: Record<string, any>
    propsAdvanced?: ArenaNodeDefPropsAdvanced
  },
  client: DbClient = DB
) => {
  checkNodeDefType(type)
  checkNodeDefProps(props)
  return await client.one(
    `
      UPDATE ${getSchemaSurvey(surveyId)}.node_def 
      SET 
          type = $1,
          props_draft = $2::jsonb,
          props_advanced_draft = $3::jsonb,
          date_modified = ${DbUtils.now}
      WHERE uuid = $4
      RETURNING ${nodeDefSelectFields}
    `,
    [type, props, propsAdvanced, nodeDefUuid],
    (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when updating a nodeDef
  )
}

// CYCLES

const copyNodeDefsCyclesLayout = async (
  surveyId: number,
  nodeDefUuid: string,
  cycleStart: string,
  cycles: string[],
  client: DbClient = DB
) => {
  // every new cycle gets a copy of the layout of the start cycle
  const layoutCycleStartPath = `(props || props_draft) #> $/layoutCycleStartPath/::text[]`
  await client.query(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', (props||props_draft)->'layout' || COALESCE(
      (SELECT jsonb_object_agg(cycle_key, ${layoutCycleStartPath}) FROM unnest($/cycles/::text[]) AS cycle_key),
      '{}'::jsonb
    ), TRUE)
    WHERE ${layoutCycleStartPath} IS NOT NULL
    ${nodeDefUuid ? ' AND uuid = $/nodeDefUuid/' : ''} 
  `,
    { layoutCycleStartPath: [NodeDef.propKeys.layout, cycleStart], cycles, nodeDefUuid }
  )
}

export const addNodeDefsCycles = async (
  surveyId: number,
  cycleStart: string,
  cycles: string[],
  client: DbClient = DB
) => {
  // Add cycle to prop cycles
  await client.query(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', (props || props_draft)->'cycles' || $1)
    WHERE (props || props_draft)->'cycles' @> $2
  `,
    [JSON.stringify(cycles), JSON.stringify(cycleStart)]
  )
  // Copy layout to cycles
  await copyNodeDefsCyclesLayout(surveyId, null, cycleStart, cycles, client)
}

export const deleteNodeDefsCyclesLayout = (
  surveyId: number,
  nodeDefUuid: string,
  cycles: string[],
  client: DbClient = DB
) =>
  client.query(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', ((props || props_draft)->'layout') - $/cycles/::text[])
    WHERE (props || props_draft) -> 'layout' IS NOT NULL
    ${nodeDefUuid ? ' AND uuid = $/nodeDefUuid/' : ''}
  `,
    { cycles, nodeDefUuid }
  )

export const deleteNodeDefsCycles = async (surveyId: number, cycles: string[], client: DbClient = DB) => {
  // Delete cycles from props
  await client.query(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', ((props || props_draft)->'cycles') - $/cycles/::text[])
  `,
    { cycles }
  )
  // Delete cycles layouts
  await deleteNodeDefsCyclesLayout(surveyId, null, cycles, client)
}

export const updateNodeDefAnalysisCycles = (surveyId: number, cycleKeys: string[], client: DbClient = DB) =>
  client.query(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', jsonb_build_array($1:csv))
    WHERE analysis
  `,
    [cycleKeys]
  )

// PUBLISH
export const publishNodeDefsProps = (surveyId: number, client: DbClient = DB) =>
  client.query(`
    UPDATE
      ${getSchemaSurvey(surveyId)}.node_def
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb,
      props_advanced = props_advanced || props_advanced_draft,
      props_advanced_draft = '{}'::jsonb
    `)

// UNPUBLISH
export const unpublishNodeDefsProps = (surveyId: number, client: DbClient = DB) =>
  client.query(`
  UPDATE
    ${getSchemaSurvey(surveyId)}.node_def
  SET
    props_draft = props || props_draft,
    props = '{}'::jsonb,
    props_advanced_draft = props_advanced || props_advanced_draft,
    props_advanced = '{}'::jsonb
  `)

// ============== DELETE

export const markNodeDefDeleted = async (surveyId: number, nodeDefUuid: string, client: DbClient = DB) => {
  const nodeDef = await client.one(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def 
    SET deleted = true
    WHERE uuid = $1
    RETURNING ${nodeDefSelectFields}
  `,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft: true, advanced: true })
  )

  const childNodeDefs = await fetchNodeDefsByParentUuid(surveyId, nodeDefUuid, true, client)
  await DbUtils.runQueries(
    client,
    childNodeDefs.map((childNodeDef) => () => markNodeDefDeleted(surveyId, NodeDef.getUuid(childNodeDef), client))
  )

  const relatedNodeDefsToDelete = await fetchAreaBasedEstimateNodeDefsOf(surveyId, nodeDefUuid, true, client)

  await DbUtils.runQueries(
    client,
    relatedNodeDefsToDelete.map(
      (childNodeDef) => () => markNodeDefDeleted(surveyId, NodeDef.getUuid(childNodeDef), client)
    )
  )

  return nodeDef
}

export const permanentlyDeleteNodeDefs = (surveyId: number, client: DbClient = DB) =>
  client.query(`
        DELETE
        FROM
          ${getSchemaSurvey(surveyId)}.node_def
        WHERE
          deleted = true
    `)

export const deleteOrphaneNodeDefs = (surveyId: number, client: DbClient = DB) =>
  client.query(`
        DELETE
        FROM
          ${getSchemaSurvey(surveyId)}.node_def
        WHERE
          analysis = true AND (
            parent_uuid IS NULL 
            OR 
            ((props_advanced || props_advanced_draft) ->> '${
              NodeDef.keysPropsAdvanced.areaBasedEstimatedOf
            }')::uuid NOT IN (
              SELECT uuid FROM ${getSchemaSurvey(surveyId)}.node_def
            )
          )
      `)

export const markNodeDefsWithoutCyclesDeleted = (surveyId: number, client: DbClient = DB) =>
  client.query(`
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET deleted = true
    WHERE
      jsonb_array_length(${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, true, '', false)}) = 0
  `)

const _deleteNodeDefsProp = (surveyId: number, deletePath: string[], client: DbClient = DB) =>
  client.none(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.node_def
    SET props = props #- $/deletePath/::text[]
  `,
    { deletePath }
  )

export const deleteNodeDefsLabels = (surveyId: number, langCode: string, client: DbClient = DB) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.labels, langCode], client)

export const deleteNodeDefsDescriptions = (surveyId: number, langCode: string, client: DbClient = DB) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.descriptions, langCode], client)

export const deleteNodeDefsValidationMessageLabels = async (
  surveyId: number,
  langs: string[],
  client: DbClient = DB
) => {
  const schema = getSchemaSurvey(surveyId)
  // one "#-" operator per language, with the path passed as a parameter
  const params = DbUtils.newQueryParams()
  const deleteMessagesOperators = langs.map((lang) => `#- ${params.add(['messages', lang])}::text[]`).join(' ')

  await client.query(
    `
    WITH
      expressions AS
      (
        SELECT
          n.uuid,
          jsonb_array_elements(n.props_advanced #> '{validations, expressions}') ${deleteMessagesOperators} AS expr
        FROM
          ${schema}.node_def n
      ),
      expressions_agg AS
      (
        SELECT
          n.uuid,
          json_agg( e.expr )::jsonb AS expressions
        FROM
          ${schema}.node_def n
        JOIN
          expressions e
        ON
          e.uuid = n.uuid
        GROUP BY
          n.uuid
      )
    UPDATE
      ${schema}.node_def n
    SET
      props_advanced = jsonb_set(n.props_advanced, '{validations, expressions}', e.expressions, false)
    FROM
      expressions_agg e
    WHERE
      e.uuid = n.uuid
  `,
    params.values
  )
}

/**
 * Fetches all virtual entities.
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {number} [params.offset] - The select query offset.
 * @param {number} [params.limit] - The select query limit.
 * @param {BaseProtocol} [client] - The database client.
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchVirtualEntities = (
  params: { surveyId: number; offset?: number; limit?: number | null },
  client: DbClient = DB
) => {
  const { surveyId, offset = 0, limit = null } = params

  const tableNodeDef = new TableNodeDef(surveyId)

  return client.map(
    ` 
    select
  _nd.*,
  _nd.props || _nd.props_draft as props
  from
  ${tableNodeDef.nameQualified} as _nd
  where _nd.virtual = TRUE and _nd.deleted = FALSE
  LIMIT $1
  OFFSET $2`,
    [limit || 'ALL', offset],
    (row) => Objects.camelize(row)
  )
}

/**
 * Count virtual entities.
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {BaseProtocol} [client] - The database client.
 * @returns {Promise<number>} - The result promise.
 */
export const countVirtualEntities = (params: { surveyId: number }, client: DbClient = DB) => {
  const { surveyId } = params
  const tableNodeDef = new TableNodeDef(surveyId)
  return client.one(`select count(*) from ${tableNodeDef.nameAliased} where virtual = TRUE and deleted = FALSE`)
}
