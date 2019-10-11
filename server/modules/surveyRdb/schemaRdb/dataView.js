const R = require('ramda')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const DataTable = require('./dataTable')
const DataCol = require('./dataCol')

const getName = NodeDefTable.getViewName

const alias = `a`
const aliasParent = `p`

const getColUuid = nodeDef => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

const getSelectFields = (survey, nodeDef) => {
  const fields = []
  Survey.visitAncestorsAndSelf(
    nodeDef,
    nodeDefCurrent => {
      const cols = getCols(
        survey,
        nodeDefCurrent,
        NodeDef.isEqual(nodeDefCurrent)(nodeDef)
      )
      fields.unshift(...cols)
    }
  )(survey)

  // add record_uuid, date_created, date_modified
  fields.unshift(
    `${NodeDef.isRoot(nodeDef) ? alias : aliasParent}.${DataTable.colNameRecordUuuid}`,
    `${alias}.${DataTable.colNameRecordCycle}`,
    `${alias}.date_created`,
    `${alias}.date_modified`
  )

  return fields
}

const getCols = (survey, nodeDef, isSelf) => {
  const fields = R.pipe(
    R.map(DataCol.getNames),
    R.flatten,
    R.map(name => `${isSelf ? alias : aliasParent}.${name}`),
  )(DataTable.getNodeDefColumns(survey, nodeDef))

  // if is not root, prepend parent uuid
  if (!NodeDef.isRoot(nodeDef))
    fields.unshift(`${aliasParent}.${getColUuid(Survey.getNodeDefParent(nodeDef)(survey))}`)

  // if nodeDef isSelf (starting nodeDef) prepend col uuid
  if (isSelf)
    fields.unshift(`${alias}.${DataTable.colNameUuuid} as ${getColUuid(nodeDef)}`)

  return fields
}

const getJoin = (schemaName, nodeDefParent) =>
  nodeDefParent
    ? `JOIN 
       ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
       ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
      `
    : ''

module.exports = {
  alias,
  aliasParent,
  getName,
  getSelectFields,
  getJoin,
}