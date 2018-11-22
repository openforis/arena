const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')
const {selectDate} = require('../db/dbUtils')

const {defDbTransformCallback} = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')

const dbTransformCallback = (def, draft = false) => R.pipe(
  // assoc published and draft properties based on props
  R.assoc('published', !R.isEmpty(def.props)),
  R.assoc('draft', !R.isEmpty(def.props_draft)),
  // apply db conversion
  R.partialRight(defDbTransformCallback, [draft]),
)(def)

const nodeDefSelectFields = `id, uuid, survey_id, parent_id, type, deleted, props, props_draft, 
     ${selectDate('date_created')}, ${selectDate('date_modified')}`

// ============== CREATE

const createNodeDef = async (surveyId, parentId, uuid, type, props, client = db) =>
  await client.one(`
    INSERT INTO node_def (survey_id, parent_id, uuid, type, props_draft)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING * 
    `,
    [surveyId, parentId, uuid, type, props],
    def => dbTransformCallback(def, true) //always loading draft when creating or updating a nodeDef
  )

const createEntityDef = async (surveyId, parentId, uuid, props, client = db) =>
  await createNodeDef(surveyId, parentId, uuid, NodeDef.nodeDefType.entity, props, client)

// ============== READ

const fetchNodeDef = async (nodeDefId = null, draft, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM node_def 
     WHERE id = $1`,
    [nodeDefId],
    res => dbTransformCallback(res, draft)
  )

const fetchNodeDefsBySurveyId = async (surveyId, draft, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM node_def 
    WHERE survey_id = $1
    AND deleted IS NOT TRUE
    ORDER BY id`,
    [surveyId],
    res => dbTransformCallback(res, draft)
  )

const fetchRootNodeDef = async (surveyId, draft, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM node_def 
     WHERE parent_id IS NULL
     AND survey_id =$1`,
    [surveyId],
    res => dbTransformCallback(res, draft)
  )

const fetchNodeDefsByParentId = async (parentId, draft, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM node_def 
    WHERE parent_id = $1
    AND deleted IS NOT TRUE
    ORDER BY id`,
    [parentId],
    res => dbTransformCallback(res, draft)
  )

const fetchRootNodeDefKeysBySurveyId = async (surveyId, draft, client = db) => {
  const rootNodeDef = await fetchRootNodeDef(surveyId, draft, client)

  return await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM node_def 
    WHERE survey_id = $1
    AND deleted IS NOT TRUE
    AND parent_id = $2
    AND props->>'key' = $3
    ORDER BY id`,
    [surveyId, rootNodeDef.id, 'true'],
    res => dbTransformCallback(res, draft)
  )
}

// ============== UPDATE

const updateNodeDefProp = async (nodeDefId, key, value, client = db) => {
  const prop = {[key]: value}

  return await client.one(`
    UPDATE node_def 
    SET props_draft = props_draft || $1,
    date_modified = timezone('UTC'::text, now())
    WHERE id = $2
    RETURNING ${nodeDefSelectFields}
  `, [JSON.stringify(prop), nodeDefId],
    def => dbTransformCallback(def, true) //always loading draft when creating or updating a nodeDef
  )
}

const publishNodeDefsProps = async (surveyId, client = db) =>
  await client.query(`
    UPDATE
        node_def n
    SET
        props = props || props_draft,
        props_draft = '{}'::jsonb
    WHERE
        n.survey_id = $1
    `, [surveyId]
  )

// ============== DELETE

const markNodeDefDeleted = async (nodeDefId, client = db) => {
  const nodeDef = await client.one(`
    UPDATE node_def 
    SET deleted = true
    WHERE id = $1
    RETURNING ${nodeDefSelectFields}
  `,
    [nodeDefId],
    def => dbTransformCallback(def, true)
  )

  const childNodeDefs = await fetchNodeDefsByParentId(nodeDefId, true, client)
  await Promise.all(childNodeDefs.map(async childNodeDef =>
    await markNodeDefDeleted(childNodeDef.id, client)
  ))

  return nodeDef
}

const permanentlyDeleteNodeDefs = async (surveyId, client = db) =>
  await client.query(`
    DELETE FROM
        node_def
    WHERE
        deleted = true
    AND survey_id = $1
    `, [surveyId]
  )

const deleteNodeDefsLabels = async (surveyId, langCode, client = db) =>
  await deleteNodeDefsProp(surveyId, ['labels', langCode], client)

const deleteNodeDefsDescriptions = async (surveyId, langCode, client = db) =>
  await deleteNodeDefsProp(surveyId, ['descriptions', langCode], client)

const deleteNodeDefsProp = async (surveyId, deletePath, client = db) =>
  await client.none(`
    UPDATE node_def 
    SET props = props #- '{${deletePath.join(',')}}'
    WHERE survey_id = $1`,
    [surveyId])

module.exports = {
  //utils
  dbTransformCallback,
  nodeDefSelectFields,

  //CREATE
  createNodeDef,
  createEntityDef,

  //READ
  fetchNodeDef,
  fetchNodeDefsBySurveyId,
  fetchRootNodeDef,
  fetchNodeDefsByParentId,
  fetchRootNodeDefKeysBySurveyId,

  //UPDATE
  updateNodeDefProp,
  publishNodeDefsProps,

  //DELETE
  markNodeDefDeleted,
  permanentlyDeleteNodeDefs,
  deleteNodeDefsLabels,
  deleteNodeDefsDescriptions,
}