const Promise = require('bluebird')
const R = require('ramda')

const db = require('../../../db/db')
const { selectDate, now } = require('../../../db/dbUtils')
const { getSurveyDBSchema, dbTransformCallback: dbTransformCallbackCommon } = require('../../../survey/surveySchemaRepositoryUtils')

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
  `id, uuid, parent_uuid, type, deleted, ${selectDate('date_created')}, ${selectDate('date_modified')}, 
  props, props_advanced, props_draft, props_advanced_draft, meta`

// ============== CREATE

const createNodeDef = async (surveyId, parentUuid, uuid, type, props, client = db) => {
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
    [parentUuid, uuid, type, props, meta],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )
}

// ============== READ

const fetchNodeDefsBySurveyId = async (surveyId, draft, advanced = false, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE deleted IS NOT TRUE
    ORDER BY id`,
    [],
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

const fetchRootNodeDefKeysBySurveyId = async (surveyId, draft, client = db) => {
  const rootNodeDef = await fetchRootNodeDef(surveyId, draft, client)

  return await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.node_def 
    WHERE deleted IS NOT TRUE
    AND parent_uuid = $1
    AND props->>'key' = $2
    ORDER BY id`,
    [rootNodeDef.uuid, 'true'],
    res => dbTransformCallback(res, draft, false)
  )
}

// ============== UPDATE

const updateNodeDefProps = async (surveyId, nodeDefUuid, propsArray, client = db) => {

  const toIndexedProps = propsArray =>
    R.reduce((acc, prop) => R.assocPath(R.split('.', prop.key), prop.value)(acc), {}, propsArray)

  const props = R.pipe(
    R.filter(R.propEq('advanced', false)),
    toIndexedProps
  )(propsArray)

  const advancedProps = R.pipe(
    R.filter(R.propEq('advanced', true)),
    toIndexedProps
  )(propsArray)

  return await client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props_draft = props_draft || $1::jsonb,
        props_advanced_draft = props_advanced_draft || $2::jsonb,
        date_modified = ${now}
    WHERE uuid = $3
    RETURNING ${nodeDefSelectFields}
  `, [props, advancedProps, nodeDefUuid],
    def => dbTransformCallback(def, true, true) //always loading draft when creating or updating a nodeDef
  )
}

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
    await markNodeDefDeleted(surveyId, childNodeDef.uuid, client)
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
  await deleteNodeDefsProp(surveyId, ['labels', langCode], client)

const deleteNodeDefsDescriptions = async (surveyId, langCode, client = db) =>
  await deleteNodeDefsProp(surveyId, ['descriptions', langCode], client)

const deleteNodeDefsProp = async (surveyId, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.node_def 
    SET props = props #- '{${deletePath.join(',')}}'
    `)

module.exports = {

  //CREATE
  createNodeDef,

  //READ
  fetchNodeDefsBySurveyId,
  fetchRootNodeDef,
  fetchNodeDefByUuid,
  fetchNodeDefsByUuid,
  // fetchNodeDefsByParentUuid,
  fetchRootNodeDefKeysBySurveyId,

  //UPDATE
  updateNodeDefProps,
  publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels,
  deleteNodeDefsDescriptions,
}
