const R = require('ramda')

const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')
const DataTable = require('./dataTable')
const DataCol = require('./dataCol')

const getName = NodeDefTable.getViewName

const alias = `a`
const aliasParent = `p`

const getColUuid = nodeDef => `${NodeDef.getNodeDefName(nodeDef)}_${DataTable.colNameUuuid}`

const getSelectFields = (survey, nodeDef) => {
  const colUuid = `${DataTable.colNameUuuid} as ${getColUuid(nodeDef)}`
  const isRoot = NodeDef.isNodeDefRoot(nodeDef)
  const hCols = isRoot
    ? [DataTable.colNameRecordUuuid, colUuid]
    : [colUuid]

  const colNames = R.pipe(
    R.map(DataCol.getNames),
    R.flatten,
    R.insertAll(0, hCols),
    R.map(name => `${alias}.${name}`),
  )(DataTable.getNodeDefColumns(survey, nodeDef))

  return isRoot
    ? colNames
    : [`${aliasParent}.*`, ...colNames]
}

const getJoin = (schemaName, nodeDef, nodeDefParent) =>
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