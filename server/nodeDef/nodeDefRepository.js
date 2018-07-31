const camelize = require('camelize')
const R = require('ramda')

const db = require('../db/db')
const {selectDate} = require('../db/dbUtils')

const {nodeDefType} = require('../../common/survey/nodeDef')

const mergeProps = (def, draft = false) => {
  if (draft) {
    const {props, propsDraft} = def
    const propsMerged = R.mergeDeepRight(props, propsDraft, def)

    return R.assoc('props', propsMerged, def)
  }
  return def
}

const dbTransformCallback = (def, draft = false) => def
  ? R.pipe(
    camelize,
    def => mergeProps(def, draft),
    R.dissoc('propsDraft'),
  )(def)
  : null

// ============== CREATE

const createNodeDef = async (surveyId, parentId, type, props, client = db) =>
  await client.one(`
    INSERT INTO node_def (survey_id, parent_id, type, props_draft)
    VALUES ($1, $2, $3, $4)
    RETURNING * 
    `,
    [surveyId, parentId, type, props],
    camelize
  )

const createEntityDef = async (surveyId, parentId, props, client = db) =>
  await createNodeDef(surveyId, parentId, nodeDefType.entity, props, client)

const createAttributeDef = async (surveyId, parentId, props, client = db) =>
  await createNodeDef(surveyId, parentId, nodeDefType.attribute, props, client)

// ============== READ

const fetchNodeDef = async (nodeDefId, draft, client = db) =>
  await client.one(
    `SELECT 
     id, uuid, survey_id, parent_id, type, deleted, props, props_draft, 
     ${selectDate('date_created')}, ${selectDate('date_modified')}
     FROM node_def WHERE id = $1`,
    [nodeDefId],
    res => dbTransformCallback(res, draft)
  )

// ============== UPDATE

// ============== DELETE

const markNodeDefDeleted = async (nodeDefId, client = db) => await client.one(
  `
  UPDATE node_def 
  SET deleted = true
  WHERE id = $1
  RETURNING *
  `,
  [nodeDefId],
  camelize
)

module.exports = {
  //utils
  dbTransformCallback,

  //CREATE
  createEntityDef,
  createAttributeDef,

  //READ
  fetchNodeDef,

  //UPDATE

  //DELETE
}