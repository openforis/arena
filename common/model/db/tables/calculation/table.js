import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: 'uuid',
  stepUuid: 'processing_step_uuid',
  nodeDefUuid: 'node_def_uuid',
  index: 'index',
  props: 'props',
  script: 'script',
}

/**
 * @typedef {module:arena.Table} TableCalculation
 */
class TableCalculation extends TableSurvey {
  constructor() {
    super('processing_step_calculation', columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== this.getColumn(columnSet.script))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }

  get columnStepUuid() {
    return this.getColumn(columnSet.stepUuid)
  }

  get columnIndex() {
    return this.getColumn(columnSet.index)
  }
}

export default new TableCalculation()
