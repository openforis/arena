const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')
const Node = require('../../../../../common/record/node')
const DataRow = require('./dataRow')
const DataCol = require('./dataCol')
const SurveyRepositoryUtils = require('../../../survey/persistence/surveySchemaRepositoryUtils')

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

const getName = NodeDefTable.getTableName

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
      getName(nodeDefParent),
      NodeDef.getNodeDefName(nodeDef) + '_' + NodeDef.getNodeDefName(nodeDefParent),
      colNameParentUuuid
    )
}

const getUuidUniqueConstraint = nodeDef => `CONSTRAINT ${NodeDef.getNodeDefName(nodeDef)}_uuid_unique_ix1 UNIQUE (${colNameUuuid})`

const getRowValues = async (survey, nodeDef, record, node, client) => {
  const rowValues = await DataRow.getValues(Survey.getSurveyInfo(survey), nodeDef, record, node, getNodeDefColumns(survey, nodeDef), client)
  return [
    node.uuid,
    NodeDef.isNodeDefRoot(nodeDef) ? record.uuid : Node.getParentUuid(node),
    ...R.flatten(rowValues)
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