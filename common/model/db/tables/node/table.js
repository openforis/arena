import camelize from 'camelize'
import * as R from 'ramda'

import * as Survey from '../../../../../core/survey/survey'
import * as Node from '../../../../../core/record/node'

import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

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

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableNode
 */
export default class TableNode extends TableSurvey {
  constructor(survey) {
    super(Survey.getId(survey), 'node', columnSet)
    this._survey = survey
    this.getSelect = getSelect.bind(this)
  }

  get survey() {
    return this._survey
  }

  get columnRecordUuid() {
    return super.getColumn(columnSet.recordUuid)
  }

  get columnParentUuid() {
    return super.getColumn(columnSet.parentUuid)
  }

  get columnNodeDefUuid() {
    return super.getColumn(columnSet.nodeDefUuid)
  }

  get columnValue() {
    return super.getColumn(columnSet.value)
  }

  get columnMeta() {
    return super.getColumn(columnSet.meta)
  }
}

TableNode.dbTransformCallback = (node) =>
  R.pipe(R.dissoc(Node.keys.meta), camelize, R.assoc(Node.keys.meta, R.prop(Node.keys.meta, node)))(node)

TableNode.columnSet = columnSet
