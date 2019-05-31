const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const Node = require('../../../../common/record/node')
const DataRow = require('./dataRow')
const DataCol = require('./dataCol')
const SurveyRepositoryUtils = require('../../survey/repository/surveySchemaRepositoryUtils')

const colNameUuuid = 'uuid'
const colNameParentUuuid = 'parent_uuid'
const colNameRecordUuuid = 'record_uuid'
const colNameMeta = 'meta'

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
  colNameRecordUuuid,
  colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames)),
  colNameMeta
]

const getColumnNamesAndType = (survey, nodeDef) => [
  colNameUuuid + ' uuid NOT NULL',
  colNameRecordUuuid + ' uuid NOT NULL',
  colNameParentUuuid + ' uuid',
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType)),
  colNameMeta + ' jsonb NOT NULL'
]

const getRecordForeignKey = (surveyId, nodeDef) =>
  _getConstraintFk(
    SurveyRepositoryUtils.getSurveyDBSchema(surveyId),
    'record',
    NodeDef.getName(nodeDef) + '_record',
    colNameRecordUuuid
  )

const getParentForeignKey = (surveyId, schemaName, nodeDef, nodeDefParent = null) =>
  _getConstraintFk(
    schemaName,
    getName(nodeDefParent),
    NodeDef.getName(nodeDef) + '_' + NodeDef.getName(nodeDefParent),
    colNameParentUuuid
  )

const getUuidUniqueConstraint = nodeDef => `CONSTRAINT ${NodeDef.getName(nodeDef)}_uuid_unique_ix1 UNIQUE (${colNameUuuid})`

const getRowValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const rowValues = DataRow.getValues(survey, nodeDefRow, nodeRow, nodeDefColumns)

  const nodeDefRowKeys = Survey.getNodeDefKeys(nodeDefRow)(survey)
  const nodeRowKeyUuidByNodeDefUuid = nodeDefRowKeys.reduce(
    (acc, nodeDefRowKey) => {
      const nodeDefRowKeyUuid = NodeDef.getUuid(nodeDefRowKey)
      acc[nodeDefRowKeyUuid] = R.path(['children', nodeDefRowKeyUuid, 'uuid'], nodeRow)
      return acc
    }, {}
  )

  const meta = {
    nodeRowKeyUuidByNodeDefUuid
  }

  return [
    Node.getUuid(nodeRow),
    nodeRow[colNameRecordUuuid],
    nodeRow[colNameParentUuuid],
    ...rowValues,
    meta
  ]
}

const _getConstraintFk = (schemaName, referencedTableName, constraint, foreignKey) => `
    CONSTRAINT ${constraint}_fk 
    FOREIGN KEY (${foreignKey}) 
    REFERENCES ${schemaName}.${referencedTableName} (uuid) 
    ON DELETE CASCADE`

module.exports = {
  colNameUuuid,
  colNameParentUuuid,
  colNameRecordUuuid,
  colNameMeta,

  getNodeDefColumns,

  getName,
  getColumnNames,
  getColumnNamesAndType,
  getRecordForeignKey,
  getParentForeignKey,
  getUuidUniqueConstraint,

  getRowValues,
}