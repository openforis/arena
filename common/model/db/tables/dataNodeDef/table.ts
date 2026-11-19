import type { ArenaSurvey, ArenaAnyNodeDef } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as StringUtils from '../../../../../core/stringUtils'

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

// table with the data of a node definition (entity or multiple attribute)
export default class TableDataNodeDef extends TableSurveyRdb {
  static readonly columnSet = columnSet
  static readonly rootDefColumnNames = rootDefColumnNames

  private readonly _survey: ArenaSurvey
  private readonly _nodeDef: ArenaAnyNodeDef

  constructor(survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef) {
    super(Survey.getId(survey), `${tableNamePrefix}_${NodeDef.getName(nodeDef)}`, columnSet)
    this._survey = survey
    this._nodeDef = nodeDef
  }

  get survey(): ArenaSurvey {
    return this._survey
  }

  get nodeDef(): ArenaAnyNodeDef {
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

  getNodeDefsForColumns({ includeAnalysis = true }: { includeAnalysis?: boolean } = {}): ArenaAnyNodeDef[] {
    const { nodeDef, survey } = this
    if (NodeDef.isAttribute(nodeDef)) {
      // Multiple attr table
      return [nodeDef]
    }
    return A.pipe(
      Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis,
        includeSamplingDefsWithoutSiblings: true,
      }),
      A.filter(NodeDef.isSingleAttribute),
      A.sortBy(A.prop('id'))
    )(survey)
  }

  get columnNodeDefs(): ColumnNodeDef[] {
    return this.getNodeDefsForColumns({ includeAnalysis: true }).map(
      (nodeDefColumn) => new ColumnNodeDef(this, nodeDefColumn)
    )
  }

  getColumnNames = ({ includeAnalysis = true }: { includeAnalysis?: boolean } = {}): string[] => {
    const { nodeDef } = this
    const nodeDefsForColumns = this.getNodeDefsForColumns({ includeAnalysis })
    const names = [columnSet.uuid, columnSet.parentUuid, columnSet.dateCreated, columnSet.dateModified]
    if (NodeDef.isRoot(nodeDef)) {
      names.push(...rootDefColumnNames)
    }
    names.push(...nodeDefsForColumns.flatMap((nodeDefCol) => ColumnNodeDef.getColumnNames(nodeDefCol)))
    return names
  }

  getColumnsWithType(): string[] {
    const columnsAndType = [...commonColumnNamesAndTypes]
    if (NodeDef.isRoot(this.nodeDef)) {
      columnsAndType.push(...rootDefColumnNamesAndTypes)
    }
    for (const nodeDefColumn of this.columnNodeDefs) {
      columnsAndType.push(
        ...nodeDefColumn.names.map((name, i) => `${StringUtils.quoteDouble(name)} ${nodeDefColumn.types[i]}`)
      )
    }
    return columnsAndType
  }

  _getConstraintFk(tableReferenced: Table, column: string): string {
    const constraintName = StringUtils.quoteDouble(`${this.name}_${tableReferenced.name}_fk`)
    return `CONSTRAINT ${constraintName} 
    FOREIGN KEY (${column}) 
    REFERENCES ${tableReferenced.nameQualified} (${columnSet.uuid}) 
    ON DELETE CASCADE`
  }

  getConstraintFkRecord(): string | null {
    if (!NodeDef.isRoot(this.nodeDef)) {
      return null
    }
    return this._getConstraintFk(new TableRecord(this.surveyId), columnSet.recordUuid)
  }

  getConstraintFkParent(): string | null {
    if (NodeDef.isRoot(this.nodeDef)) {
      return null
    }
    const ancestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(this.nodeDef)(this.survey)
    return this._getConstraintFk(new TableDataNodeDef(this.survey, ancestorMultipleEntity), columnSet.parentUuid)
  }

  getConstraintUuidUnique(): string {
    const constraintName = StringUtils.quoteDouble(`${NodeDef.getName(this.nodeDef)}_uuid_unique_ix1`)
    return `CONSTRAINT ${constraintName} UNIQUE (${columnSet.uuid})`
  }

  getRowValuesByColumnName = ({
    nodeRow,
    nodeDefColumns,
  }: {
    nodeRow: Record<string, any>
    nodeDefColumns: ArenaAnyNodeDef[]
  }): Record<string, unknown> => {
    const { survey, nodeDef } = this
    const valuesByColumnName = TableDataNodeDefRowUtils.getValuesByColumnName({ survey, nodeRow, nodeDefColumns })
    const result: Record<string, unknown> = {
      [columnSet.uuid]: nodeRow[columnSet.uuid],
      [columnSet.parentUuid]: nodeRow[columnSet.ancestorUuid],
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
