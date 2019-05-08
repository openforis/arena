const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')
const DataTable = require('./dataTable')
const DataCol = require('./dataCol')

const getName = NodeDefTable.getViewName

const alias = `a`
const aliasParent = `p`

const getColUuid = nodeDef => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

const getSelectFields = (survey, nodeDef) => {
  let fields = []
  let currentNodeDef = nodeDef
  do {
    const isParent = nodeDef !== currentNodeDef

    // Add cols from currentNodeDef
    const newCols = getCols(survey, currentNodeDef, isParent ? aliasParent : alias)
    fields = R.insertAll(0, newCols)(fields)

    // Add parent uuid if not root
    if (!NodeDef.isRoot(currentNodeDef)) {
      const parentUuid = aliasParent + '.' + getColUuid(Survey.getNodeDefParent(currentNodeDef)(survey))
      fields = R.append(parentUuid)(fields)
    }

    // Add col uuid
    if (!isParent) {
      const colUuid = `${alias}.${DataTable.colNameUuuid} as ${getColUuid(nodeDef)}`
      fields = R.append(colUuid)(fields)
    }

    currentNodeDef = Survey.getNodeDefParent(currentNodeDef)(survey)
  } while (currentNodeDef)

  // Add record uuid
  fields = R.append(`${NodeDef.isRoot(nodeDef) ? alias : aliasParent}.${DataTable.colNameRecordUuuid}`)(fields)

  // Add date created and modified
  return R.concat(fields, [`${alias}.date_created`, `${alias}.date_modified`])
}

const getJoin = (schemaName, nodeDefParent) =>
  nodeDefParent
    ? `JOIN 
       ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
       ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
      `
    : ''

const getCols = (survey, nodeDef, tableAlias) => {
  const colNames = R.pipe(
    R.map(DataCol.getNames),
    R.flatten,
    R.map(name => `${tableAlias}.${name}`),
  )(DataTable.getNodeDefColumns(survey, nodeDef))

  return colNames
}

module.exports = {
  alias,
  aliasParent,
  getName,
  getSelectFields,
  getJoin,
}