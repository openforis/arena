const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const DataRow = require('./dataRow')
const DataCol = require('./dataCol')
const SurveyRepositoryUtils = require('../../survey/repository/surveySchemaRepositoryUtils')

const colNameUuuid = 'uuid'
const colNameParentUuuid = 'parent_uuid'
const colNameRecordUuuid = 'record_uuid'

const getNodeDefColumns = (survey, nodeDef) =>
  NodeDef.isEntity(nodeDef)
    ? (
      R.pipe(
        Survey.getNodeDefChildren(nodeDef),
        R.filter(NodeDef.isSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')))
      )(survey)
    )
    // multiple attr table
    : [nodeDef]

const getName = NodeDefTable.getTableName

const getColumnNames = (survey, nodeDef) => [
  colNameUuuid,
  NodeDef.isRoot(nodeDef) ? colNameRecordUuuid : colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames))
]

const getColumnNamesAndType = (survey, nodeDef) => [
  colNameUuuid + ' uuid NOT NULL',
  (NodeDef.isRoot(nodeDef) ? colNameRecordUuuid : colNameParentUuuid) + ' uuid NOT NULL',
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType))
]

const getParentForeignKey = (surveyId, schemaName, nodeDef, nodeDefParent = null) => {
  const getConstraintFk = (schemaName, referencedTableName, constraint, foreignKey) => `
    CONSTRAINT ${constraint}_fk 
    FOREIGN KEY (${foreignKey}) 
    REFERENCES ${schemaName}.${referencedTableName} (uuid) 
    ON DELETE CASCADE`

  return NodeDef.isRoot(nodeDef)
    ? getConstraintFk(
      SurveyRepositoryUtils.getSurveyDBSchema(surveyId),
      'record',
      NodeDef.getName(nodeDef) + '_record',
      colNameRecordUuuid
    )
    : getConstraintFk(
      schemaName,
      getName(nodeDefParent),
      NodeDef.getName(nodeDef) + '_' + NodeDef.getName(nodeDefParent),
      colNameParentUuuid
    )
}

const getUuidUniqueConstraint = nodeDef => `CONSTRAINT ${NodeDef.getName(nodeDef)}_uuid_unique_ix1 UNIQUE (${colNameUuuid})`

const getRowValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const rowValues = DataRow.getValues(survey, nodeDefRow, nodeRow, nodeDefColumns)
  return [
    Node.getUuid(nodeRow),
    NodeDef.isRoot(nodeDefRow) ? nodeRow[colNameRecordUuuid] : nodeRow[colNameParentUuuid],
    ...rowValues,
  ]
}

module.exports = {
  colNameUuuid,
  colNameParentUuuid,
  colNameRecordUuuid,
  getNodeDefColumns,

  getName,
  getColumnNames,
  getColumnNamesAndType,
  getParentForeignKey,
  getUuidUniqueConstraint,

  getRowValues,
}