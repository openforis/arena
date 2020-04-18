import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: 'uuid',
  dateCreated: 'date_created',
  dateModified: 'date_modified',
  dateExecuted: 'date_executed',
  props: 'props',
  validation: 'validation',
  statusExec: 'status_exec',
  scriptCommon: 'script_common',
}

/**
 * @typedef {module:arena.Table} TableChain
 */
class TableChain extends TableSurvey {
  constructor() {
    super('processing_chain', columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== this.getColumn(columnSet.scriptCommon))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }

  get columnDateCreated() {
    return this.getColumn(columnSet.dateCreated)
  }

  get columnProps() {
    return this.getColumn(columnSet.props)
  }
}

export default new TableChain()
