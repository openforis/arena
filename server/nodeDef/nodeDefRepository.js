const camelize = require('camelize')
const R = require('ramda')

const db = require('../db/db')
const {selectDate} = require('../db/dbUtils')

const {defDbTransformCallback} = require('../../common/survey/surveyUtils')
const {nodeDefType} = require('../../common/survey/nodeDef')

const dbTransformCallback = (def, draft = false) => R.pipe(
  R.assoc('published', !R.isEmpty(def.props)),
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
  await createNodeDef(surveyId, parentId, uuid, nodeDefType.entity, props, client)

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
    FROM node_def WHERE survey_id = $1
    ORDER BY id`,
    [surveyId],
    res => dbTransformCallback(res, draft)
  )

const fetchNodeDefsByParentId = async (parentId, draft, client = db) =>
  await client.map(`
    SELECT ${nodeDefSelectFields}
    FROM node_def WHERE parent_id = $1
    ORDER BY id`,
    [parentId],
    res => dbTransformCallback(res, draft)
  )

// ============== UPDATE

const updateNodeDefProp = async (nodeDefId, {key, value}, client = db) => {
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

// ============== DELETE

const markNodeDefDeleted = async (nodeDefId, client = db) =>
  await client.one(`
    UPDATE node_def 
    SET deleted = true
    WHERE id = $1
    RETURNING *
  `,
    [nodeDefId],
    res => dbTransformCallback(res, true)
  )

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
  fetchNodeDefsByParentId,

  //UPDATE
  updateNodeDefProp,

  //DELETE
}