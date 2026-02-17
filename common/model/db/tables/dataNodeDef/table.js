import * as R from 'ramda'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import Table from '../table'
import TableSurveyRdb from '../tableSurveyRdb'
import TableRecord from '../record'
import ColumnNodeDef from './columnNodeDef'
import { TableDataNodeDefRowUtils } from './rowUtils'

const tableNamePrefix = 'data'

const columnSet = {
  id: Table.columnSetCommon.id,
  dateCreated: Table.columnSetCommon.dateCreated,
  dateModified: Table.columnSetCommon.dateModified,
  iId: Table.columnSetCommon.iId,
  parentInternalId: 'p_i_id',
  ancestorIId: 'a_i_id',
  recordUuid: 'record_uuid',
  recordCycle: 'record_cycle',
  recordStep: 'record_step',
  recordOwnerUuid: 'record_owner_uuid',
}

const rootDefColumnNames = [
  columnSet.recordUuid,
  columnSet.recordCycle,
  columnSet.recordStep,
  columnSet.recordOwnerUuid,
]

const commonColumnNamesAndTypes = [
  `${columnSet.id}                bigint      NOT NULL GENERATED ALWAYS AS IDENTITY`,
  `${columnSet.recordUuid}        uuid        NOT NULL`,
  `${columnSet.iId}               int         NOT NULL`,
  `${columnSet.parentInternalId}  int         NULL`,
  `${columnSet.dateCreated}       TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
  `${columnSet.dateModified}      TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
]

const rootDefColumnNamesAndTypes = [
  `${columnSet.recordCycle}     varchar(2)  NOT NULL`,
  `${columnSet.recordStep}      varchar(63) NOT NULL`,
  `${columnSet.recordOwnerUuid} uuid        NOT NULL`,
]

/**
 * @typedef {module:arena.TableSurveyRdb} module:arena.TableDataNodeDef
 * @property {Survey} survey - The survey.
 * @property {NodeDef} nodeDef - The nodeDef table.
 * @property {ColumnNodeDef[]} columnNodeDefs - The nodeDef columns.
 */
export default class TableDataNodeDef extends TableSurveyRdb {
  constructor(survey, nodeDef) {
    super(Survey.getId(survey), `${tableNamePrefix}_${NodeDef.getName(nodeDef)}`, columnSet)
    this._survey = survey
    this._nodeDef = nodeDef
  }

  get survey() {
    return this._survey
  }

  get nodeDef() {
    return this._nodeDef
  }

  get columnId() {
    return this.getColumn(columnSet.id)
  }

  get columnIId() {
    return this.getColumn(columnSet.iId)
  }

  get columnIIdName() {
    return this.columnIId.name
  }

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }

  get columnParentInternalId() {
    return this.getColumn(columnSet.parentInternalId)
  }

  get columnParentInternalIdName() {
    return this.columnParentInternalId.name
  }

  get columnRecordUuid() {
    return this.getColumn(columnSet.recordUuid)
  }

  get columnRecordCycle() {
    return this.getColumn(columnSet.recordCycle)
  }

  get columnRecordStep() {
    return this.getColumn(columnSet.recordStep)
  }

  get columnRecordOwnerUuid() {
    return this.getColumn(columnSet.recordOwnerUuid)
  }

  getNodeDefsForColumns({ includeAnalysis = true } = {}) {
    const { nodeDef, survey } = this
    if (NodeDef.isAttribute(nodeDef)) {
      // Multiple attr table
      return [nodeDef]
    }
    return R.pipe(
      Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis,
        includeSamplingDefsWithoutSiblings: true,
      }),
      R.filter(NodeDef.isSingleAttribute),
      R.sortBy(R.ascend(R.prop('id')))
    )(survey)
  }

  get columnNodeDefs() {
    return this.getNodeDefsForColumns({ includeAnalysis: true }).map(
      (nodeDefColumn) => new ColumnNodeDef(this, nodeDefColumn)
    )
  }

  getColumnNames = ({ includeAnalysis = true } = {}) => {
    const { nodeDef } = this
    const nodeDefsForColumns = this.getNodeDefsForColumns({ includeAnalysis })
    const names = [
      columnSet.recordUuid,
      columnSet.iId,
      columnSet.parentInternalId,
      columnSet.dateCreated,
      columnSet.dateModified,
    ]
    if (NodeDef.isRoot(nodeDef)) {
      names.push(...rootDefColumnNames)
    }
    names.push(...nodeDefsForColumns.flatMap((nodeDefCol) => ColumnNodeDef.getColumnNames(nodeDefCol)))
    return names
  }

  getColumnsWithType() {
    const columnsAndType = []
    columnsAndType.push(...commonColumnNamesAndTypes)
    if (NodeDef.isRoot(this.nodeDef)) {
      columnsAndType.push(...rootDefColumnNamesAndTypes)
    }
    for (const nodeDefColumn of this.columnNodeDefs) {
      for (let i = 0; i < nodeDefColumn.names.length; i++) {
        const name = nodeDefColumn.names[i]
        const type = nodeDefColumn.types[i]
        columnsAndType.push(`${name} ${type}`)
      }
    }
    return columnsAndType
  }

  _getConstraintFk(tableReferenced, ...columns) {
    const referencedColumnNames = [columnSet.recordUuid]
    if (columns.length > 1) {
      referencedColumnNames.push(columnSet.iId)
    }
    return `CONSTRAINT ${this.name}_${tableReferenced.name}_fk 
    FOREIGN KEY (${columns.join(', ')}) 
    REFERENCES ${tableReferenced.nameQualified} (${referencedColumnNames.join(', ')}) 
    ON DELETE CASCADE`
  }

  getConstraintFkRecord() {
    if (!NodeDef.isRoot(this.nodeDef)) {
      return null
    }
    return this._getConstraintFk(new TableRecord(this.surveyId), columnSet.recordUuid)
  }

  getConstraintFkParent() {
    if (NodeDef.isRoot(this.nodeDef)) {
      return null
    }
    const ancestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(this.nodeDef)(this.survey)
    return this._getConstraintFk(
      new TableDataNodeDef(this.survey, ancestorMultipleEntity),
      columnSet.recordUuid,
      columnSet.parentInternalId
    )
  }

  getConstraintIIdUnique() {
    return `CONSTRAINT ${NodeDef.getName(this.nodeDef)}_i_id_unique_ix1 UNIQUE (${columnSet.recordUuid}, ${columnSet.iId})`
  }

  getRowValuesByColumnName = ({ nodeRow, nodeDefColumns }) => {
    const { survey, nodeDef } = this
    const valuesByColumnName = TableDataNodeDefRowUtils.getValuesByColumnName({ survey, nodeRow, nodeDefColumns })
    const result = {
      [columnSet.iId]: nodeRow[columnSet.iId],
      [columnSet.recordUuid]: nodeRow[columnSet.recordUuid],
      [columnSet.parentInternalId]: nodeRow[columnSet.ancestorIId],
      [columnSet.dateCreated]: nodeRow[columnSet.dateCreated],
      [columnSet.dateModified]: nodeRow[columnSet.dateModified],
    }
    if (NodeDef.isRoot(nodeDef)) {
      for (const colName of rootDefColumnNames) {
        result[colName] = nodeRow[colName]
      }
    }
    Object.assign(result, valuesByColumnName)
    return result
  }
}

TableDataNodeDef.columnSet = columnSet
TableDataNodeDef.rootDefColumnNames = rootDefColumnNames
