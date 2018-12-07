const R = require('ramda')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')
const DataRow = require('./dataRow')
const DataCol = require('./dataCol')
const SurveyRepositoryUtils = require('../survey/surveySchemaRepositoryUtils')

const colNameUuuid = 'uuid'
const colNameParentUuuid = 'parent_uuid'
const colNameRecordUuuid = 'record_uuid'

const getNodeDefColumns = (survey, nodeDef) =>
  NodeDef.isNodeDefEntity(nodeDef)
    ? (
      R.pipe(
        Survey.getNodeDefChildren(nodeDef),
        R.filter(NodeDef.isNodeDefSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')))
      )(survey)
    )
    // multiple attr table
    : [nodeDef]

const getTableName = (nodeDef, nodeDefChild = null) => {
  const childName = nodeDefChild ? `_${nodeDefChild.id}` : ''
  return `_${nodeDef.id}${childName}_data`
}

const getColumnNames = (survey, nodeDef) => [
  colNameUuuid,
  NodeDef.isNodeDefRoot(nodeDef) ? colNameRecordUuuid : colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames))
]

const getColumnNamesAndType = (survey, nodeDef) => [
  colNameUuuid + ' uuid NOT NULL',
  (NodeDef.isNodeDefRoot(nodeDef) ? colNameRecordUuuid : colNameParentUuuid) + ' uuid NOT NULL',
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType))
]

const getRowValues = async (survey, nodeDef, record, node) => {
  const rowValues = await DataRow.getValues(Survey.getSurveyInfo(survey), nodeDef, record, node, getNodeDefColumns(survey, nodeDef))
  return [
    node.uuid,
    NodeDef.isNodeDefRoot(nodeDef) ? record.uuid : Node.getParentUuid(node),
    ...R.flatten(rowValues)
  ]
}

const getParentForeignKey = (surveyId, schemaName, nodeDef, nodeDefParent = null) => {
  const getConstraintFk = (schemaName, referencedTableName, constraint, foreignKey) => `
    CONSTRAINT ${constraint}_fk 
    FOREIGN KEY (${foreignKey}) 
    REFERENCES ${schemaName}.${referencedTableName} (uuid) 
    ON DELETE CASCADE`

  return NodeDef.isNodeDefRoot(nodeDef)
    ? getConstraintFk(
      SurveyRepositoryUtils.getSurveyDBSchema(surveyId),
      'record',
      NodeDef.getNodeDefName(nodeDef) + '_record',
      colNameRecordUuuid
    )
    : getConstraintFk(
      schemaName,
      getTableName(nodeDefParent),
      NodeDef.getNodeDefName(nodeDef) + '_' + NodeDef.getNodeDefName(nodeDefParent),
      colNameParentUuuid
    )
}

module.exports = {
  colNameUuuid,
  colNameParentUuuid,
  colNameRecordUuuid,

  getTableName,
  getColumnNames,
  getColumnNamesAndType,
  getParentForeignKey,

  getRowValues,
}