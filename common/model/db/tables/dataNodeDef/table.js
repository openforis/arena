import * as R from 'ramda'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import Table from '../table'
import TableSurveyRdb from '../tableSurveyRdb'
import TableRecord from '../record'
import ColumnNodeDef from './columnNodeDef'

const columnSet = {
  id: Table.columnSetCommon.id,
  dateCreated: Table.columnSetCommon.dateCreated,
  dateModified: Table.columnSetCommon.dateModified,
  uuid: Table.columnSetCommon.uuid,
  recordUuid: 'record_uuid',
  recordCycle: 'record_cycle',
  parentUuid: 'parent_uuid',
}

/**
 * @typedef {module:arena.TableSurveyRdb} module:arena.TableDataNodeDef
 * @property {Survey} survey - The survey.
 * @property {NodeDef} nodeDef - The nodeDef table.
 * @property {ColumnNodeDef[]} columnNodeDefs - The nodeDef columns.
 */
export default class TableDataNodeDef extends TableSurveyRdb {
  constructor(survey, nodeDef) {
    super(Survey.getId(survey), `data_${NodeDef.getName(nodeDef)}`, columnSet)
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

  get columnRecordUuid() {
    return this.getColumn(columnSet.recordUuid)
  }

  get columnRecordCycle() {
    return this.getColumn(columnSet.recordCycle)
  }

  get columnParentUuid() {
    return this.getColumn(columnSet.parentUuid)
  }

  get columnNodeDefs() {
    let nodeDefs = null
    if (NodeDef.isAttribute(this.nodeDef)) {
      nodeDefs = [this.nodeDef] // Multiple attr table
    } else {
      const descendants = Survey.getNodeDefDescendantAttributesInSingleEntities(this.nodeDef, true)(this.survey)
      nodeDefs = R.sortBy(R.ascend(R.prop('id')))(descendants)
    }
    return nodeDefs.map((nodeDefColumn) => new ColumnNodeDef(this, nodeDefColumn))
  }

  getColumnsWithType() {
    const columnsAndType = []
    columnsAndType.push(
      `${columnSet.id}            bigint      NOT NULL GENERATED ALWAYS AS IDENTITY`,
      `${columnSet.dateCreated}   TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
      `${columnSet.dateModified}  TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')`,
      `${columnSet.uuid}          uuid        NOT NULL`,
      `${columnSet.recordUuid}    uuid        NOT NULL`,
      `${columnSet.recordCycle}   varchar(2)  NOT NULL`,
      `${columnSet.parentUuid}    uuid            NULL`
    )
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
}

TableDataNodeDef.columnSet = columnSet
