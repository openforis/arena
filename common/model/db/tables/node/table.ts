import camelize from 'camelize'

import type { ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Node from '../../../../../core/record/node'
import * as Survey from '../../../../../core/survey/survey'
import Table from '../table'
import TableSurvey from '../tableSurvey'

import { getSelect, GetSelectParams } from './select'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  id: Table.columnSetCommon.id,
  recordUuid: 'record_uuid',
  parentUuid: 'parent_uuid',
  nodeDefUuid: 'node_def_uuid',
  value: 'value',
  meta: 'meta',
  dateCreated: Table.columnSetCommon.dateCreated,
  dateModified: Table.columnSetCommon.dateModified,
}

export default class TableNode extends TableSurvey {
  static readonly columnSet = columnSet

  // a node row: meta is kept as is (not camelized)
  static readonly dbTransformCallback = (node: Record<string, any>): Record<string, any> =>
    A.pipe(A.dissoc(Node.keys.meta), camelize, A.assoc(Node.keys.meta, A.prop(Node.keys.meta, node)))(node)

  private readonly _survey: ArenaSurvey
  getSelect: (params: GetSelectParams) => string

  constructor(survey: ArenaSurvey) {
    super(Survey.getId(survey), 'node', columnSet)
    this._survey = survey
    this.getSelect = getSelect.bind(this)
  }

  get survey(): ArenaSurvey {
    return this._survey
  }

  get columnRecordUuid(): string {
    return super.getColumn(columnSet.recordUuid)
  }

  get columnParentUuid(): string {
    return super.getColumn(columnSet.parentUuid)
  }

  get columnNodeDefUuid(): string {
    return super.getColumn(columnSet.nodeDefUuid)
  }

  get columnValue(): string {
    return super.getColumn(columnSet.value)
  }

  get columnMeta(): string {
    return super.getColumn(columnSet.meta)
  }
}
