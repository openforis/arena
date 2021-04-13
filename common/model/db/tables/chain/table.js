import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  dateCreated: Table.columnSetCommon.dateCreated,
  dateModified: Table.columnSetCommon.dateModified,
  dateExecuted: 'date_executed',
  props: Table.columnSetCommon.props,
  validation: 'validation',
  statusExec: 'status_exec',
  scriptCommon: 'script_common',
}

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableChain
 */
export default class TableChain extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'chain', columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== this.getColumn(columnSet.scriptCommon))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }
}

TableChain.columnSet = columnSet
