import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  stepUuid: 'processing_step_uuid',
  nodeDefUuid: 'node_def_uuid',
  index: 'index',
  props: Table.columnSetCommon.props,
  script: 'script',
}

const tableName = 'processing_step_calculation'
/**
 * @typedef {module:arena.TableSurvey} module:arena.TableCalculation
 */
export default class TableCalculation extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, tableName, columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== this.getColumn(columnSet.script))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }

  get columnStepUuid() {
    return this.getColumn(columnSet.stepUuid)
  }

  get columnIndex() {
    return this.getColumn(columnSet.index)
  }

  get columnScript() {
    return this.getColumn(columnSet.script)
  }

  get columnNodeDefUuid() {
    return this.getColumn(columnSet.nodeDefUuid)
  }
}

TableCalculation.columnSet = columnSet
TableCalculation.tableName = tableName
