const camelize = require('camelize')
const R = require('ramda')

const db = require('../db/db')
const {nodeDefType} = require('../../common/survey/nodeDef')

// ============== CREATE

const createNodeDef = async (surveyVersionId, props, client = db, type) => await client.one(
  ` 
  INSERT INTO node_def (survey_version_id, type, props)
  VALUES ($1, $2)
  RETURNING * 
  `,
  [surveyVersionId, type, props],
  camelize
)

const createEntityDef = R.partialRight(createNodeDef, [nodeDefType.entity])

const createAttributeDef = R.partialRight(createNodeDef, [nodeDefType.attribute])

// ============== READ

// ============== UPDATE

// ============== DELETE

const markNodeDefDeleted = async (surveyVersionId, nodeDefId, client = db) => await client.one(
  `
  UPDATE node_def 
  SET deleted_survey_version_id = $1 
  WHERE id = $2
  RETURNING *
  `,
  [surveyVersionId, nodeDefId],
  camelize
)

module.exports = {
  createEntityDef,
  createAttributeDef,
}