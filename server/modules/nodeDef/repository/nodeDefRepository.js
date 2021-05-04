import * as R from 'ramda'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as NodeDef from '@core/survey/nodeDef'
import {
  getSurveyDBSchema,
  dbTransformCallback as dbTransformCallbackCommon,
} from '../../survey/repository/surveySchemaRepositoryUtils'

const dbTransformCallback = ({ row, draft, advanced = false, backup = false }) => {
  const rowUpdated = { ...row }
  if (advanced) {
    if (!R.isEmpty(row.props_advanced_draft)) {
      rowUpdated.draft_advanced = true
    }
    if (draft && !backup) {
      // merge props_advanced and props_advanced_draft into props_advanced
      rowUpdated.props_advanced = R.mergeDeepLeft(row.props_advanced_draft, row.props_advanced)
    }
    if (!backup || !draft) {
      // ignore pops_advanced_draft
      delete rowUpdated.props_advanced_draft
    }
  }
  return dbTransformCallbackCommon(rowUpdated, draft, true, backup)
}

const nodeDefSelectFields = `id, uuid, parent_uuid, type, deleted, analysis, virtual, 
  ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

export const insertNodeDef = async (surveyId, nodeDef, client = db) =>
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

export const insertNodeDefsBatch = async ({ surveyId, nodeDefs, backup = false, client = db }) =>
  client.none(
    DbUtils.insertAllQueryBatch(
      getSurveyDBSchema(surveyId),
      'node_def',
      [
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
      ],
      nodeDefs.map((nodeDef) => ({
        ...nodeDef,
        parent_uuid: NodeDef.getParentUuid(nodeDef),
        props: backup ? NodeDef.getProps(nodeDef) : {},
        props_draft: backup ? NodeDef.getPropsDraft(nodeDef) : NodeDef.getProps(nodeDef),
        props_advanced: backup ? NodeDef.getPropsAdvanced(nodeDef) : {},
        props_advanced_draft: backup ? NodeDef.getPropsAdvancedDraft(nodeDef) : NodeDef.getPropsAdvanced(nodeDef),
      }))
    )
  )
// ============== READ

export const fetchNodeDefsBySurveyId = async (
  { surveyId, cycle, draft, advanced = false, includeDeleted = false, backup = false },
  client = db
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
    ORDER BY id`,
    [JSON.stringify(cycle || null)],
    (row) => dbTransformCallback({ row, draft, advanced, backup })
  )

export const fetchRootNodeDef = async (surveyId, draft, client = db) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE parent_uuid IS NULL`,
    [],
    (row) => dbTransformCallback({ row, draft })
  )

export const fetchNodeDefByUuid = async (surveyId, nodeDefUuid, draft, advanced = false, client = db) =>
  client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE uuid = $1`,
    [nodeDefUuid],
    (row) => dbTransformCallback({ row, draft, advanced })
  )

const fetchNodeDefsByParentUuid = async (surveyId, parentUuid, draft, client = db) =>
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

export const fetchRootNodeDefKeysBySurveyId = async (surveyId, nodeDefRootUuid, draft, client = db) =>
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

export const updateNodeDefProps = async (surveyId, nodeDefUuid, parentUuid, props, propsAdvanced = {}, client = db) =>
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

// CYCLES
export const updateNodeDefDescendantsCycles = async (surveyId, nodeDefUuid, cycles, add, client = db) => {
  const op = add ? `|| '[${cycles.map(JSON.stringify).join(',')}]'` : cycles.map((c) => `- '${c}'`).join(' ')

  return client.map(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{"cycles"}', (SELECT jsonb_agg( value order by value::int ) FROM jsonb_array_elements_text((((props||props_draft)->'cycles') ${op}))))
    WHERE meta->'h' @> $1
    RETURNING ${nodeDefSelectFields}`,
    [JSON.stringify(nodeDefUuid)],
    (row) => dbTransformCallback({ row, draft: true, advanced: true }) // Always loading draft when creating or updating a nodeDef
  )
}

export const copyNodeDefsCyclesLayout = async (surveyId, nodeDefUuid, cycleStart, cycles, client = db) => {
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

export const addNodeDefsCycles = async (surveyId, cycleStart, cycles, client = db) => {
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

export const deleteNodeDefsCyclesLayout = async (surveyId, nodeDefUuid, cycles, client = db) =>
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

export const deleteNodeDefsCycles = async (surveyId, cycles, client = db) => {
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

export const updateNodeDefAnalysisCycles = async (surveyId, cycleKeys, client = db) =>
  client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', jsonb_build_array($1:csv))
    WHERE analysis
  `,
    [cycleKeys]
  )

// PUBLISH
export const publishNodeDefsProps = async (surveyId, client = db) =>
  client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.node_def
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb,
      props_advanced = props_advanced || props_advanced_draft,
      props_advanced_draft = '{}'::jsonb
    `)

// ============== DELETE

export const markNodeDefDeleted = async (surveyId, nodeDefUuid, client = db) => {
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

  return nodeDef
}

export const permanentlyDeleteNodeDefs = async (surveyId, client = db) =>
  client.query(`
        DELETE
        FROM
          ${getSurveyDBSchema(surveyId)}.node_def
        WHERE
          deleted = true
    `)

export const markNodeDefsWithoutCyclesDeleted = async (surveyId, client = db) =>
  client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET deleted = true
    WHERE
      jsonb_array_length(${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, true, '', false)}) = 0
  `)

const _deleteNodeDefsProp = async (surveyId, deletePath, client = db) =>
  client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props #- '{${deletePath.join(',')}}'
  `)

export const deleteNodeDefsLabels = async (surveyId, langCode, client = db) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.labels, langCode], client)

export const deleteNodeDefsDescriptions = async (surveyId, langCode, client = db) =>
  _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.descriptions, langCode], client)

export const deleteNodeDefsValidationMessageLabels = async (surveyId, langs, client = db) => {
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
