const R = require('ramda')
const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

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

const getSqlColumnNames = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid`
  : `${NodeDef.getNodeDefName(nodeDef)}`

const getSqlColumns = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${getSqlColumnNames(nodeDef)} uuid`
  : `${getSqlColumnNames(nodeDef)} VARCHAR`

const getSqlColumnValues = (survey, nodeDef, record, node) => {
  if (NodeDef.isNodeDefEntity(nodeDef)) {
    // entity column

    const n = NodeDef.isNodeDefRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : Record.getNodeChildrenByDefUuid(node, nodeDef.uuid)(record)

    if (!n || R.isEmpty(n)) {
      return getSqlColumnValues(survey, nodeDef, record, Record.getParentNode(node)(record))
    } else
      return `'${n[0].uuid}'`

  } else {

    if (Node.getNodeDefUuid(node) === nodeDef.uuid) {
      // attribute column in multiple attribute table

      return `'${node.value}'`
    } else {
      // attribute column in entity table

      const n = Record.getNodeChildrenByDefUuid(node, nodeDef.uuid)(record)
      return R.isEmpty(n) ? `''` : `'${n[0].value}'`
    }
  }
}

const getNodeDefsAncestorsHierarchy = (survey, nodeDef) => {

  const getHierarchy = nodeDef => NodeDef.isNodeDefRoot(nodeDef)
    ? [nodeDef]
    : R.append(
      nodeDef,
      getHierarchy(Survey.getNodeDefParent(nodeDef)(survey))
    )

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  return nodeDefParent ? getHierarchy(nodeDefParent) : []
}

const getNodeDefColumns = (survey, nodeDef) => {
  if (NodeDef.isNodeDefEntity(nodeDef)) {

    return R.pipe(
      Survey.getNodeDefChildren(nodeDef),
      R.reject(NodeDef.isNodeDefMultiple),
      R.reject(NodeDef.isNodeDefEntity),
      R.concat(getNodeDefsAncestorsHierarchy(survey, nodeDef)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )(survey)

  } else {

    const parent = Survey.getNodeDefParent(nodeDef)(survey)
    return R.pipe(
      R.append(parent),
      R.append(nodeDef),
      R.concat(getNodeDefsAncestorsHierarchy(survey, parent)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )([])

  }
}

const createNodeDefTable = async (survey, nodeDef) => {

  const nodeDefColumns = getNodeDefColumns(survey, nodeDef)
  const sqlColumns = nodeDefColumns.map(getSqlColumns)

  await db.query(`
    CREATE TABLE
      ${getSchemaName(getSurveyId(survey))}.${getNodeDefTableName(survey, nodeDef)}
    (
      id          bigserial NOT NULL,
      uuid        uuid      NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${sqlColumns.join(',')},
      PRIMARY KEY (id)
    )
  `)
}

// ==== DATA INSERT

const populateNodeDefTable = async (survey, nodeDef, record) => {

  const nodeDefColumns = getNodeDefColumns(survey, nodeDef)

  const sqlColumnNames = nodeDefColumns.map(getSqlColumnNames)
  const sqlColumnValues = (node) => nodeDefColumns.map(nodeDef => getSqlColumnValues(survey, nodeDef, record, node))

  const nodes = Record.getNodesByDefUuid(nodeDef.uuid)(record)

  const inserts = nodes.map(node => `
      INSERT INTO 
        ${getSchemaName(getSurveyId(survey))}.${getNodeDefTableName(survey, nodeDef)}
        (uuid, ${sqlColumnNames.join(',')})
      VALUES 
        ('${node.uuid}', ${sqlColumnValues(node).join(',')})
      `)

  await db.tx(async t => await t.batch(
    inserts.map(i => t.query(i))
  ))
}

module.exports = {
  dropSchema,
  createSchema,
  createNodeDefTable,

  populateNodeDefTable,
}