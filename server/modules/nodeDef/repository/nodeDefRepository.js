import * as R from 'ramda'

import * as DbUtils from '@server/db/dbUtils'
import * as NodeDef from '@core/survey/nodeDef'
import { DB, BaseProtocol, TableNodeDef } from '@openforis/arena-server'
import { Objects } from '@openforis/arena-core'
import {
  getSurveyDBSchema,
  dbTransformCallback as dbTransformCallbackCommon,
} from '../../survey/repository/surveySchemaRepositoryUtils'

const dbTransformCallback = ({ row, draft, advanced = false, backup = false }) => {
  const rowUpdated = { ...row }

  if (advanced || backup) {
    if (!R.isEmpty(rowUpdated.props_advanced_draft)) {
      // there are draft advanced props to merge with "published" advanced props
      rowUpdated.draft_advanced = true

      // set updated props flags
      if (rowUpdated.props_advanced_draft[NodeDef.keysPropsAdvanced.validations]) {
        rowUpdated.draft_advanced_validations = true
      }
      if (rowUpdated.props_advanced_draft[NodeDef.keysPropsAdvanced.applicable]) {
        rowUpdated.draft_advanced_applicable = true
      }
      if (rowUpdated.props_advanced_draft[NodeDef.keysPropsAdvanced.defaultValues]) {
        rowUpdated.draft_advanced_default_values = true
      }

      if (draft && !backup) {
        // merge props_advanced and props_advanced_draft into props_advanced
        rowUpdated.props_advanced = R.mergeDeepLeft(row.props_advanced_draft, row.props_advanced)
        delete rowUpdated.props_advanced_draft
      }
    }
    if ((!backup && !draft) || R.isEmpty(rowUpdated.props_advanced_draft)) {
      // ignore props_advanced_draft
      delete rowUpdated.props_advanced_draft
    }
  } else {
    delete rowUpdated.props_advanced
    delete rowUpdated.props_advanced_draft
  }
  return dbTransformCallbackCommon(rowUpdated, draft, true, backup)
}

const nodeDefSelectFields = `id, uuid, parent_uuid, type, deleted, analysis, virtual, 
  ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

export const insertNodeDef = async (surveyId, nodeDef, client = DB) =>
  client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.node_def 
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

export const insertNodeDefsBatch = async ({ surveyId, nodeDefs, backup = false }, client = DB) =>
  client.tx(async (tx) => {
    const schema = getSurveyDBSchema(surveyId)
    await tx.batch([
      nodeDefs.map((nodeDef) =>
        tx.none(
          `
    INSERT INTO ${schema}.node_def (
        parent_uuid,
        uuid,
        type,
        props,
        props_draft,
        props_advanced,
        props_advanced_draft,
        meta,
        analysis,
        virtual)
    VALUES ($1, $2, $3, 
    $4::jsonb, $5::jsonb,
    $6::jsonb, $7::jsonb, 
    $8,$9,$10)`,
          [
            NodeDef.getParentUuid(nodeDef),
            nodeDef.uuid,
            NodeDef.getType(nodeDef),
            backup ? NodeDef.getProps(nodeDef) : {},
            backup ? NodeDef.getPropsDraft(nodeDef) : NodeDef.getProps(nodeDef),
            backup ? NodeDef.getPropsAdvanced(nodeDef) : {},
            backup ? NodeDef.getPropsAdvancedDraft(nodeDef) : NodeDef.getPropsAdvanced(nodeDef),
            NodeDef.getMeta(nodeDef),
            NodeDef.isAnalysis(nodeDef),
            NodeDef.isVirtual(nodeDef),
          ]
        )
      ),
    ])
  })

// ============== READ

export const countNodeDefsBySurveyId = async ({ surveyId, draft = true }, client = DB) =>
  client.one(
    `
    SELECT COUNT(*)
    FROM ${getSurveyDBSchema(surveyId)}.node_def
    WHERE TRUE
    ${!draft ? " AND props <> '{}'::jsonb" : ''}`,
    {},
    (row) => Number(row.count)
  )

export const fetchNodeDefsBySurveyId = async (
  { surveyId, cycle, draft, advanced = false, includeDeleted = false, backup = false, includeAnalysis = true },
  client = DB
) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE TRUE
      ${
        cycle
          ? `--filter by cycle
          AND ${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, draft, '', false)} @> $1`
          : ''
      } 
      ${!backup && !draft ? " AND props <> '{}'::jsonb" : ''}
      ${!includeDeleted ? ' AND deleted IS NOT TRUE' : ''}
      ${!includeAnalysis ? ' AND analysis IS NOT TRUE' : ''}
    ORDER BY id`,
    [JSON.stringify(cycle || null)],
    (row) => dbTransformCallback({ row, draft, advanced, backup })
  )

export const fetchRootNodeDef = async (surveyId, draft, client = DB) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE parent_uuid IS NULL`,
    [],
    (row) => dbTransformCallback({ row, draft })
  )

export const fetchNodeDefByUuid = async (surveyId, nodeDefUuid, draft, advanced = false, client = DB) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE uuid = $1`,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft, advanced })
  )

const fetchNodeDefsByParentUuid = async (surveyId, parentUuid, draft, client = DB) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE parent_uuid = $1
    AND deleted IS NOT TRUE
    ORDER BY id`,
    [parentUuid],
    (row) => dbTransformCallback({ row, draft })
  )

const fetchAreaBasedEstimateNodeDefsOf = async (surveyId, nodeDefUuid, draft, client = DB) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE 
    (props_advanced || props_advanced_draft) ->> '${NodeDef.keysPropsAdvanced.areaBasedEstimatedOf}' = $1
    AND deleted IS NOT TRUE`,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft })
  )

export const fetchRootNodeDefKeysBySurveyId = async (surveyId, nodeDefRootUuid, draft, client = DB) =>
  client.map(
    `
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE deleted IS NOT TRUE
    AND parent_uuid = $1
    AND ${DbUtils.getPropColCombined('key', draft)} = $2
    ORDER BY id`,
    [nodeDefRootUuid, 'true'],
    (row) => dbTransformCallback({ row, draft })
  )

// ============== UPDATE

export const updateNodeDefProps = async (surveyId, nodeDefUuid, parentUuid, props, propsAdvanced = {}, client = DB) =>
  client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props_draft = props_draft || $1::jsonb,
        props_advanced_draft = props_advanced_draft || $2::jsonb,
        parent_uuid = $3,
        date_modified = ${DbUtils.now}
    WHERE uuid = $4
    RETURNING ${nodeDefSelectFields}
  `,
    [props, propsAdvanced, parentUuid, nodeDefUuid],
    (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when updating a nodeDef
  )

export const updateNodeDefPropsInBatch = async ({ surveyId, nodeDefs }, client = DB) =>
  client.tx(async (tx) => {
    const schema = getSurveyDBSchema(surveyId)
    const nodedefsUpdated = await tx.batch(
      nodeDefs.map(async (nodeDef) => {
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
    return nodedefsUpdated
  })

// CYCLES

const copyNodeDefsCyclesLayout = async (surveyId, nodeDefUuid, cycleStart, cycles, client = DB) => {
  const layoutCycleStartPath = `(props || props_draft) #> '{layout,${cycleStart}}'`
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', (props||props_draft)->'layout' || jsonb_build_object(${cycles
      .map((c) => `'${c}', ${layoutCycleStartPath}`)
      .join(', ')}), TRUE)
    WHERE ${layoutCycleStartPath} IS NOT NULL
    ${nodeDefUuid ? ' AND uuid = $1' : ''} 
  `,
    [nodeDefUuid]
  )
}

export const addNodeDefsCycles = async (surveyId, cycleStart, cycles, client = DB) => {
  // Add cycle to prop cycles
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', (props || props_draft)->'cycles' || $1)
    WHERE (props || props_draft)->'cycles' @> $2
  `,
    [JSON.stringify(cycles), JSON.stringify(cycleStart)]
  )
  // Copy layout to cycles
  await copyNodeDefsCyclesLayout(surveyId, null, cycleStart, cycles, client)
}

export const deleteNodeDefsCyclesLayout = async (surveyId, nodeDefUuid, cycles, client = DB) =>
  client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', ((props || props_draft)->'layout') ${cycles
      .map((c) => `- '${c}'`)
      .join(' ')})
    WHERE (props || props_draft) -> 'layout' IS NOT NULL
    ${nodeDefUuid ? ' AND uuid = $1' : ''}
  `,
    [nodeDefUuid]
  )

export const deleteNodeDefsCycles = async (surveyId, cycles, client = DB) => {
  // Delete cycles from props
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', ((props || props_draft)->'cycles') ${cycles
      .map((c) => `- '${c}'`)
      .join(' ')})
  `)
  // Delete cycles layouts
  await deleteNodeDefsCyclesLayout(surveyId, null, cycles, client)
}

export const updateNodeDefAnalysisCycles = async (surveyId, cycleKeys, client = DB) =>
  client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', jsonb_build_array($1:csv))
    WHERE analysis
  `,
    [cycleKeys]
  )

// PUBLISH
export const publishNodeDefsProps = async (surveyId, client = DB) =>
  client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.node_def
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb,
      props_advanced = props_advanced || props_advanced_draft,
      props_advanced_draft = '{}'::jsonb
    `)

// UNPUBLISH
export const unpublishNodeDefsProps = async (surveyId, client = DB) =>
  client.query(`
  UPDATE
    ${getSurveyDBSchema(surveyId)}.node_def
  SET
    props_draft = props_draft || props,
    props = '{}'::jsonb,
    props_advanced_draft = props_advanced_draft || props_advanced,
    props_advanced = '{}'::jsonb
  `)

// ============== DELETE

export const markNodeDefDeleted = async (surveyId, nodeDefUuid, client = DB) => {
  const nodeDef = await client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET deleted = true
    WHERE uuid = $1
    RETURNING ${nodeDefSelectFields}
  `,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft: true, advanced: true })
  )

  const childNodeDefs = await fetchNodeDefsByParentUuid(surveyId, nodeDefUuid, true, client)
  await Promise.all(
    childNodeDefs.map(async (childNodeDef) => markNodeDefDeleted(surveyId, NodeDef.getUuid(childNodeDef), client))
  )

  const relatedNodeDefsToDelete = await fetchAreaBasedEstimateNodeDefsOf(surveyId, nodeDefUuid, true, client)

  await Promise.all(
    relatedNodeDefsToDelete.map(async (childNodeDef) =>
      markNodeDefDeleted(surveyId, NodeDef.getUuid(childNodeDef), client)
    )
  )

  return nodeDef
}

export const permanentlyDeleteNodeDefs = async (surveyId, client = DB) =>
  client.query(`
        DELETE
        FROM
          ${getSurveyDBSchema(surveyId)}.node_def
        WHERE
          deleted = true
    `)

export const deleteOrphaneNodeDefs = async (surveyId, client = DB) =>
  client.query(`
        DELETE
        FROM
          ${getSurveyDBSchema(surveyId)}.node_def
        WHERE
          analysis = true AND (
            parent_uuid IS NULL 
            OR 
            ((props_advanced || props_advanced_draft) ->> '${
              NodeDef.keysPropsAdvanced.areaBasedEstimatedOf
            }')::uuid NOT IN (
              SELECT uuid FROM ${getSurveyDBSchema(surveyId)}.node_def
            )
          )
      `)

export const markNodeDefsWithoutCyclesDeleted = async (surveyId, client = DB) =>
  client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET deleted = true
    WHERE
      jsonb_array_length(${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, true, '', false)}) = 0
  `)

const _deleteNodeDefsProp = async (surveyId, deletePath, client = DB) =>
  client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props #- '{${deletePath.join(',')}}'
  `)

export const deleteNodeDefsLabels = async (surveyId, langCode, client = DB) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.labels, langCode], client)

export const deleteNodeDefsDescriptions = async (surveyId, langCode, client = DB) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.descriptions, langCode], client)

export const deleteNodeDefsValidationMessageLabels = async (surveyId, langs, client = DB) => {
  const schema = getSurveyDBSchema(surveyId)

  await client.query(`
    WITH
      expressions AS
      (
        SELECT
          n.uuid,
          jsonb_array_elements(n.props_advanced #> '{validations, expressions}') ${langs
            .map((l) => `#- '{messages, ${l}}'`)
            .join(' ')} AS expr
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
  `)
}

/**
 * Fetches all virtual entities.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchVirtualEntities = async (params, client = DB) => {
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
    Objects.camelize
  )
}

/**
 * Count virtual entities.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The result promise.
 */
export const countVirtualEntities = async (params, client = DB) => {
  const { surveyId } = params
  const tableNodeDef = new TableNodeDef(surveyId)
  return client.one(`select count(*) from ${tableNodeDef.nameAliased} where virtual = TRUE and deleted = FALSE`)
}
