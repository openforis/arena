import * as R from 'ramda';
import Survey from '../../../../core/survey/survey';
import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import Node from '../../../../core/record/node';
import DataRow from './dataRow';
import DataCol from './dataCol';
import SurveyRepositoryUtils from '../../survey/repository/surveySchemaRepositoryUtils';
import { INodeDefs } from '../../../../core/survey/_survey/surveyNodeDefs';

const colNameUuuid = 'uuid'
const colNameParentUuuid = 'parent_uuid'
const colNameRecordUuuid = 'record_uuid'
const colNameRecordCycle = 'record_cycle'

const getNodeDefColumns: (survey: INodeDefs, nodeDef: INodeDef) => INodeDef[]
= (survey, nodeDef) =>
  NodeDef.isEntity(nodeDef)
    ? (
      R.pipe(
        Survey.getNodeDefChildren(nodeDef),
        R.filter(NodeDef.isSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')) as any) as (x: INodeDef[]) => INodeDef[],
      )(survey)
    )
    // multiple attr table
    : [nodeDef]

const getName = NodeDefTable.getTableName

const getColumnNames = (survey, nodeDef) => [
  colNameUuuid,
  colNameRecordUuuid,
  colNameRecordCycle,
  colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames))
]

const getColumnNamesAndType = (survey, nodeDef) => [
  colNameUuuid + ' uuid NOT NULL',
  colNameRecordUuuid + ' uuid NOT NULL',
  colNameRecordCycle + ' integer NOT NULL',
  colNameParentUuuid + ' uuid',
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType))
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

  return [
    Node.getUuid(nodeRow),
    nodeRow[colNameRecordUuuid],
    nodeRow[colNameRecordCycle],
    nodeRow[colNameParentUuuid],
    ...rowValues
  ]
}

const _getConstraintFk = (schemaName, referencedTableName, constraint, foreignKey) => `
    CONSTRAINT ${constraint}_fk
    FOREIGN KEY (${foreignKey})
    REFERENCES ${schemaName}.${referencedTableName} (uuid)
    ON DELETE CASCADE`

export default {
  colNameUuuid,
  colNameParentUuuid,
  colNameRecordUuuid,
  colNameRecordCycle,

  getNodeDefColumns,

  getName,
  getColumnNames,
  getColumnNamesAndType,
  getRecordForeignKey,
  getParentForeignKey,
  getUuidUniqueConstraint,

  getRowValues,
};
