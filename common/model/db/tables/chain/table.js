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
 * @typedef {module:arena.TableSurvey} module:arena.TableChain
 */
export default class TableChain extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'processing_chain', columnSet)
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

TableChain.columnSet = columnSet
