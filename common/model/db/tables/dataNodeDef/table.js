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
  uuid: Table.columnSetCommon.uuid,
  parentUuid: 'parent_uuid',
  ancestorUuid: 'ancestor_uuid',
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
  `${columnSet.id}            bigint      NOT NULL GENERATED ALWAYS AS IDENTITY`,
  `${columnSet.dateCreated}   TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
  `${columnSet.dateModified}  TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
  `${columnSet.uuid}          uuid        NOT NULL`,
  `${columnSet.parentUuid}    uuid            NULL`,
]

const rootDefColumnNamesAndTypes = [
  `${columnSet.recordUuid}      uuid        NOT NULL`,
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

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }

  get columnParentUuid() {
    return this.getColumn(columnSet.parentUuid)
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
    const names = [columnSet.uuid, columnSet.parentUuid, columnSet.dateCreated, columnSet.dateModified]
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
    this.columnNodeDefs.forEach((nodeDefColumn) => {
      columnsAndType.push(...nodeDefColumn.names.map((name, i) => `${name} ${nodeDefColumn.types[i]}`))
    })
    return columnsAndType
  }

  _getConstraintFk(tableReferenced, column) {
    return `CONSTRAINT ${this.name}_${tableReferenced.name}_fk 
    FOREIGN KEY (${column}) 
    REFERENCES ${tableReferenced.nameQualified} (${columnSet.uuid}) 
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
    return this._getConstraintFk(new TableDataNodeDef(this.survey, ancestorMultipleEntity), columnSet.parentUuid)
  }

  getConstraintUuidUnique() {
    return `CONSTRAINT ${NodeDef.getName(this.nodeDef)}_uuid_unique_ix1 UNIQUE (${columnSet.uuid})`
  }

  getRowValuesByColumnName = ({ nodeRow, nodeDefColumns }) => {
    const { survey, nodeDef } = this
    const getRowValuesByColumnName = TableDataNodeDefRowUtils.getValuesByColumnName({ survey, nodeRow, nodeDefColumns })
    return {
      [columnSet.uuid]: nodeRow[columnSet.uuid],
      [columnSet.parentUuid]: nodeRow[columnSet.ancestorUuid],
      [columnSet.dateCreated]: nodeRow[columnSet.dateCreated],
      [columnSet.dateModified]: nodeRow[columnSet.dateModified],
      ...(NodeDef.isRoot(nodeDef)
        ? rootDefColumnNames.reduce((acc, colName) => {
            acc[colName] = nodeRow[colName]
            return acc
          }, {})
        : {}),
      ...getRowValuesByColumnName,
    }
  }
}

TableDataNodeDef.columnSet = columnSet
TableDataNodeDef.rootDefColumnNames = rootDefColumnNames
