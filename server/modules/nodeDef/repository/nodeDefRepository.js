import * as R from 'ramda'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import { getSurveyDBSchema, dbTransformCallback as dbTransformCallbackCommon } from '../../survey/repository/surveySchemaRepositoryUtils';

import * as NodeDef from '@core/survey/nodeDef'

const dbTransformCallback = (nodeDef, draft, advanced = false) => {

  const def = advanced ?
    R.pipe(
      def => R.isEmpty(nodeDef.props_advanced_draft)
        ? def
        : R.assoc('draft_advanced', true, def),
      R.assoc('props', R.mergeDeepLeft(nodeDef.props, nodeDef.props_advanced)),
      R.assoc('props_draft', R.mergeDeepLeft(nodeDef.props_draft, nodeDef.props_advanced_draft)),
      R.omit(['props_advanced', 'props_advanced_draft'])
    )(nodeDef)
    : nodeDef

  return dbTransformCallbackCommon(def, draft, true)

}

const nodeDefSelectFields =
  `id, uuid, parent_uuid, type, deleted, analysis, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

export const insertNodeDef = async (surveyId, nodeDef, client = db) => {
  const parentUuid = NodeDef.getParentUuid(nodeDef)
  return await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.node_def 
          (parent_uuid, uuid, type, props_draft, meta)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING *
    `,
    [parentUuid, NodeDef.getUuid(nodeDef), NodeDef.getType(nodeDef), NodeDef.getProps(nodeDef), JSON.stringify(NodeDef.getMeta(nodeDef))],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )
}

// ============== READ

export const fetchNodeDefsBySurveyId = async (surveyId, cycle = null, draft, advanced = false, includeDeleted = false, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE TRUE
      ${cycle ? `--filter by cycle
          AND ${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, draft, '', false)} @> $1` : ''} 
      ${!draft ? ` AND props <> '{}'::jsonb` : ''}
      ${!includeDeleted ? ' AND deleted IS NOT TRUE' : ''}
    ORDER BY id`,
    [JSON.stringify(cycle)],
    res => dbTransformCallback(res, draft, advanced)
  )

export const fetchRootNodeDef = async (surveyId, draft, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE parent_uuid IS NULL`,
    [],
    res => dbTransformCallback(res, draft, false)
  )

export const fetchNodeDefByUuid = async (surveyId, nodeDefUuid, draft, advanced = false, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE uuid = $1`,
    [nodeDefUuid],
    res => dbTransformCallback(res, draft, advanced)
  )

export const fetchNodeDefsByUuid = async (surveyId, nodeDefUuids = [], draft = false, advanced = false, client = db) =>
  await client.map(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE uuid in (${nodeDefUuids.map((uuid, i) => `$${i + 1}`).join(',')})`,
    [...nodeDefUuids],
    res => dbTransformCallback(res, draft, advanced)
  )

const fetchNodeDefsByParentUuid = async (surveyId, parentUuid, draft, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE parent_uuid = $1
    AND deleted IS NOT TRUE
    ORDER BY id`,
    [parentUuid],
    res => dbTransformCallback(res, draft, false)
  )

export const fetchRootNodeDefKeysBySurveyId = async (surveyId, nodeDefRootUuid, draft, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE deleted IS NOT TRUE
    AND parent_uuid = $1
    AND ${DbUtils.getPropColCombined('key', draft)} = $2
    ORDER BY id`,
    [nodeDefRootUuid, 'true'],
    res => dbTransformCallback(res, draft, false)
  )

// ============== UPDATE

export const updateNodeDefProps = async (surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props_draft = props_draft || $1::jsonb,
        props_advanced_draft = props_advanced_draft || $2::jsonb,
        date_modified = ${DbUtils.now}
    WHERE uuid = $3
    RETURNING ${nodeDefSelectFields}
  `, [props, propsAdvanced, nodeDefUuid],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )

export const updateNodeDefPropsPublished = async (surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props || $1::jsonb,
        props_advanced = props_advanced || $2::jsonb
    WHERE uuid = $3
    RETURNING ${nodeDefSelectFields}
  `, [props, propsAdvanced, nodeDefUuid],
    def => dbTransformCallback(def, false, true)
  )

// CYCLES
export const updateNodeDefDescendantsCycles = async (surveyId, nodeDefUuid, cycles, add, client = db) => {
  const op = add
    ? `|| '[${cycles.map(JSON.stringify).join(',')}]'`
    : cycles.map(c => `- '${c}'`).join(' ')

  return await client.map(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{"cycles"}', (SELECT jsonb_agg( value order by value::int ) FROM jsonb_array_elements_text((((props||props_draft)->'cycles') ${op}))))
    WHERE meta->'h' @> $1
    RETURNING ${nodeDefSelectFields}`,
    [JSON.stringify(nodeDefUuid)],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )
}

export const addNodeDefsCycles = async (surveyId, cycleStart, cycles, client = db) => {
  // add cycle to prop cycles
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', (props || props_draft)->'cycles' || $1)
    WHERE (props || props_draft)->'cycles' @> $2
  `,
    [JSON.stringify(cycles), JSON.stringify(cycleStart)]
  )
  // copy layout to cycles
  await copyNodeDefsCyclesLayout(surveyId, null, cycleStart, cycles, client)
}

export const copyNodeDefsCyclesLayout = async (surveyId, nodeDefUuid = null, cycleStart, cycles, client = db) => {
  const layoutCycleStartPath = `(props || props_draft) #> '{layout,${cycleStart}}'`
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', (props||props_draft)->'layout' || jsonb_build_object(${cycles.map(c => `'${c}', ${layoutCycleStartPath}`).join(', ')}), TRUE)
    WHERE ${layoutCycleStartPath} IS NOT NULL
    ${nodeDefUuid ? ` AND uuid = $1` : ''} 
  `, [nodeDefUuid])
}

export const deleteNodeDefsCycles = async (surveyId, cycles, client = db) => {
  // delete cycles from props
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{cycles}', ((props || props_draft)->'cycles') ${cycles.map(c => `- '${c}'`).join(' ')})
  `)
  // delete cycles layouts
  await deleteNodeDefsCyclesLayout(surveyId, null, cycles, client)
}

export const deleteNodeDefsCyclesLayout = async (surveyId, nodeDefUuid = null, cycles, client = db) =>
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{layout}', ((props || props_draft)->'layout') ${cycles.map(c => `- '${c}'`).join(' ')})
    WHERE (props || props_draft) -> 'layout' IS NOT NULL
    ${nodeDefUuid ? ` AND uuid = $1` : ''}
  `, [nodeDefUuid])

//PUBLISH
export const publishNodeDefsProps = async (surveyId, client = db) =>
  await client.query(`
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
  const nodeDef = await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET deleted = true
    WHERE uuid = $1
    RETURNING ${nodeDefSelectFields}
  `,
    [nodeDefUuid],
    def => dbTransformCallback(def, true, true)
  )

  const childNodeDefs = await fetchNodeDefsByParentUuid(surveyId, nodeDefUuid, true, client)
  await Promise.all(childNodeDefs.map(async childNodeDef =>
    await markNodeDefDeleted(surveyId, NodeDef.getUuid(childNodeDef), client)
  ))

  return nodeDef
}

export const permanentlyDeleteNodeDefs = async (surveyId, client = db) =>
  await client.query(`
        DELETE
        FROM
          ${getSurveyDBSchema(surveyId)}.node_def
        WHERE
          deleted = true
    `)

export const markNodeDefsWithoutCyclesDeleted = async (surveyId, client = db) =>
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET deleted = true
    WHERE
      jsonb_array_length(${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, true, '', false)}) = 0
  `)

export const deleteNodeDefsLabels = async (surveyId, langCode, client = db) =>
  await _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.labels, langCode], client)

export const deleteNodeDefsDescriptions = async (surveyId, langCode, client = db) =>
  await _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.descriptions, langCode], client)

const _deleteNodeDefsProp = async (surveyId, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props #- '{${deletePath.join(',')}}'
    `)

export const deleteNodeDefsValidationMessageLabels = async (surveyId, langs, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  await client.query(`
    WITH
      expressions AS
      (
        SELECT
          n.uuid,
          jsonb_array_elements(n.props_advanced #> '{validations, expressions}') ${langs.map(l => `#- '{messages, ${l}}'`).join(' ')} AS expr
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

