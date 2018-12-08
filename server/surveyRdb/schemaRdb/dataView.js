const R = require('ramda')
const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

const DataTable = require('./../schemaRdb/dataTable')
const DataCol = require('./../schemaRdb/dataCol')

const getName = (nodeDef, nodeDefParent) => DataTable.getTableName(nodeDef, nodeDefParent) + '_view'

const alias = `a`
const aliasParent = `p`
const getNodeDefColumns = (survey, nodeDef) => {
  const tableColumns = DataTable.getNodeDefColumns(survey, nodeDef)
  const nodeDefCols = NodeDef.isNodeDefEntity(nodeDef) ?
    [nodeDef, ...tableColumns]
    : tableColumns

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return nodeDefParent
    ? [...getNodeDefColumns(survey, nodeDefParent), ...nodeDefCols]
    : nodeDefCols
}

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