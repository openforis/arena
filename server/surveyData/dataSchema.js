const R = require('ramda')
const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')

// ==== Schema
const getSchemaName = surveyId => `survey_${surveyId}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== NodeDef Tables

const getNodeDefTableName = (survey, nodeDef) => {
  const prefix = NodeDef.isNodeDefEntity(nodeDef)
    ? nodeDef.id
    : `${Survey.getNodeDefParent(nodeDef)(survey).id}_${nodeDef.id}`

  return `_${prefix}_data`
}

const getSqlColumns = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid uuid`
  : `${NodeDef.getNodeDefName(nodeDef)} VARCHAR`

const getNodeDefsHierarchyUntilRoot = (survey, nodeDef) => {

  const h = nodeDef => NodeDef.isNodeDefRoot(nodeDef)
    ? [nodeDef]
    : R.append(
      nodeDef,
      h(Survey.getNodeDefParent(nodeDef)(survey))
    )

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return nodeDefParent
    ? h(nodeDefParent)
    : []
}

const getNodeDefColumns = (survey, nodeDef) => {
  if (NodeDef.isNodeDefEntity(nodeDef)) {

    return R.pipe(
      Survey.getNodeDefChildren(nodeDef),
      R.reject(NodeDef.isNodeDefMultiple),
      R.concat(getNodeDefsHierarchyUntilRoot(survey, nodeDef)),
      R.reject(R.isEmpty)
    )(survey)

  } else {

    const parent = Survey.getNodeDefParent(nodeDef)(survey)
    return R.pipe(
      R.append(parent),
      R.append(nodeDef),
      R.concat(getNodeDefsHierarchyUntilRoot(survey, parent)),
      R.reject(R.isEmpty)
    )([])

  }
}

const createNodeDefTable = async (survey, nodeDef) => {

  const {id: surveyId} = Survey.getSurveyInfo(survey)

  const nodeDefColumns = getNodeDefColumns(survey, nodeDef)
  console.log("== " , JSON.stringify(nodeDefColumns))
  const columns = nodeDefColumns.map(getSqlColumns)

  await db.query(`
    CREATE TABLE
      ${getSchemaName(surveyId)}.${getNodeDefTableName(survey, nodeDef)}
    (
      id          bigserial NOT NULL,
      uuid        uuid      NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${columns.join(',')},
      PRIMARY KEY (id)
    )
  `)
}

module.exports = {
  dropSchema,
  createSchema,
  createNodeDefTable,
}