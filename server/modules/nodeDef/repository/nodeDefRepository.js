const R = require('ramda')

const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')
const { getSurveyDBSchema, dbTransformCallback: dbTransformCallbackCommon } = require('../../survey/repository/surveySchemaRepositoryUtils')

const NodeDef = require('../../../../common/survey/nodeDef')

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
  `id, uuid, parent_uuid, type, deleted, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

const insertNodeDef = async (surveyId, nodeDef, client = db) => {
  const parentUuid = NodeDef.getParentUuid(nodeDef)
  const parentH = parentUuid ?
    await client.one(
      `SELECT meta->'h' as h FROM ${getSurveyDBSchema(surveyId)}.node_def WHERE uuid = $1`,
      [parentUuid]
    ) : {}

  const meta = {
    h: R.isEmpty(parentH) ? [] : R.append(parentUuid, parentH.h)
  }

  return await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.node_def 
          (parent_uuid, uuid, type, props_draft, meta)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING *
    `,
    [parentUuid, NodeDef.getUuid(nodeDef), NodeDef.getType(nodeDef), NodeDef.getProps(nodeDef), meta],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )
}

// ============== READ

const fetchNodeDefsBySurveyId = async (surveyId, cycle = null, draft, advanced = false, includeDeleted = false, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE TRUE
      ${cycle ? `--filter by cycle
          AND ${DbUtils.getPropColCombined(NodeDef.propKeys.cycles, draft, '', true)} @> $1` : ''} 
      ${!draft ? ` AND props <> '{}'::jsonb` : ''}
      ${!includeDeleted ? ' AND deleted IS NOT TRUE' : ''}
    ORDER BY id`,
    [JSON.stringify(cycle)],
    res => dbTransformCallback(res, draft, advanced)
  )

const fetchRootNodeDef = async (surveyId, draft, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE parent_uuid IS NULL`,
    [],
    res => dbTransformCallback(res, draft, false)
  )

const fetchNodeDefByUuid = async (surveyId, nodeDefUuid, draft, advanced = false, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.node_def 
     WHERE uuid = $1`,
    [nodeDefUuid],
    res => dbTransformCallback(res, draft, advanced)
  )

const fetchNodeDefsByUuid = async (surveyId, nodeDefUuids = [], draft = false, advanced = false, client = db) =>
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

const fetchRootNodeDefKeysBySurveyId = async (surveyId, nodeDefRootUuid, draft, client = db) =>
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

const updateNodeDefProps = async (surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
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

const updateNodeDefPropsPublished = async (surveyId, nodeDefUuid, props, propsAdvanced = {}, client = db) =>
  await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props || $1::jsonb,
        props_advanced = props_advanced || $2::jsonb
    WHERE uuid = $3
    RETURNING ${nodeDefSelectFields}
  `, [props, propsAdvanced, nodeDefUuid],
    def => dbTransformCallback(def, false, true) //always loading draft when creating or updating a nodeDef
  )

const addNodeDefsCycles = async (surveyId, cycleStart, cycles, client = db) =>
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{"cycles"}', (props || props_draft)->'cycles' || $1)
    WHERE (props || props_draft)->'cycles' @> $2
  `,
    [JSON.stringify(cycles), JSON.stringify(cycleStart)]
  )

const deleteNodeDefsCycles = async (surveyId, cycles, client = db) =>
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def
    SET props_draft = jsonb_set(props_draft, '{"cycles"}', ((props || props_draft)->'cycles') ${cycles.map(c => `- '${c}'`).join(' ')})
  `)

const publishNodeDefsProps = async (surveyId, client = db) =>
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

const markNodeDefDeleted = async (surveyId, nodeDefUuid, client = db) => {
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

const permanentlyDeleteNodeDefs = async (surveyId, client = db) =>
  await client.query(`
        DELETE
        FROM
          ${getSurveyDBSchema(surveyId)}.node_def
        WHERE
          deleted = true
    `)

const deleteNodeDefsLabels = async (surveyId, langCode, client = db) =>
  await _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.labels, langCode], client)

const deleteNodeDefsDescriptions = async (surveyId, langCode, client = db) =>
  await _deleteNodeDefsProp(surveyId, [NodeDef.propKeys.descriptions, langCode], client)

const _deleteNodeDefsProp = async (surveyId, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props #- '{${deletePath.join(',')}}'
    `)

const deleteNodeDefsValidationMessageLabels = async (surveyId, langs, client = db) => {
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

module.exports = {

  //CREATE
  insertNodeDef,

  //READ
  fetchNodeDefsBySurveyId,
  fetchRootNodeDef,
  fetchNodeDefByUuid,
  fetchNodeDefsByUuid,
  // fetchNodeDefsByParentUuid,
  fetchRootNodeDefKeysBySurveyId,

  //UPDATE
  updateNodeDefProps,
  updateNodeDefPropsPublished,
  addNodeDefsCycles,
  deleteNodeDefsCycles,
  publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels,
  deleteNodeDefsDescriptions,
  deleteNodeDefsValidationMessageLabels,
}
