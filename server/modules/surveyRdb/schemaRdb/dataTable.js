import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as Node from '@core/record/node'
import * as SurveyRepositoryUtils from '../../survey/repository/surveySchemaRepositoryUtils'
import * as DataRow from './dataRow'
import * as DataCol from './dataCol'

export const colNameUuuid = 'uuid'
export const colNameParentUuuid = 'parent_uuid'
export const colNameRecordUuuid = 'record_uuid'
export const colNameRecordCycle = 'record_cycle'
export const colNameDateCreated = 'date_created'
export const colNameDateModified = 'date_modified'

export const getNodeDefColumns = (survey, nodeDef) =>
  NodeDef.isEntity(nodeDef)
    ? R.pipe(
        Survey.getNodeDefChildren(nodeDef, NodeDef.isAnalysis(nodeDef)),
        R.filter(NodeDef.isSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')))
      )(survey)
    : [nodeDef] // Multiple attr table

export const getName = NodeDefTable.getTableName

export const getColumnNames = (survey, nodeDef) => [
  colNameUuuid,
  colNameRecordUuuid,
  colNameRecordCycle,
  colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames)),
]

export const getColumnNamesAndType = (survey, nodeDef) => [
  `${colNameUuuid} uuid NOT NULL`,
  `${colNameRecordUuuid} uuid NOT NULL`,
  `${colNameRecordCycle} varchar(2) NOT NULL`,
  `${colNameParentUuuid} uuid`,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType)),
]

const _getConstraintFk = (schemaName, referencedTableName, constraint, foreignKey) => `
    CONSTRAINT ${constraint}_fk 
    FOREIGN KEY (${foreignKey}) 
    REFERENCES ${schemaName}.${referencedTableName} (uuid) 
    ON DELETE CASCADE`

export const getRecordForeignKey = (surveyId, nodeDef) =>
  _getConstraintFk(
    SurveyRepositoryUtils.getSurveyDBSchema(surveyId),
    'record',
    `${NodeDef.getName(nodeDef)}_record`,
    colNameRecordUuuid
  )

export const getParentForeignKey = (surveyId, schemaName, nodeDef, nodeDefParent = null) =>
  _getConstraintFk(
    schemaName,
    getName(nodeDefParent),
    `${NodeDef.getName(nodeDef)}_${NodeDef.getName(nodeDefParent)}`,
    colNameParentUuuid
  )

export const getUuidUniqueConstraint = (nodeDef) =>
  `CONSTRAINT ${NodeDef.getName(nodeDef)}_uuid_unique_ix1 UNIQUE (${colNameUuuid})`

export const getRowValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const rowValues = DataRow.getValues(survey, nodeDefRow, nodeRow, nodeDefColumns)

  return [
    Node.getUuid(nodeRow),
    nodeRow[colNameRecordUuuid],
    nodeRow[colNameRecordCycle],
    nodeRow[colNameParentUuuid],
    ...rowValues,
  ]
}
