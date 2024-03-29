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
  scriptEnd: 'script_end',
}

const scriptColumnNames = [columnSet.scriptCommon, columnSet.scriptEnd]

const tableName = 'chain'

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableChain
 */
export default class TableChain extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, tableName, columnSet)
    const scriptColumns = scriptColumnNames.map((col) => this.getColumn(col))
    this._columnsNoScript = this.columns.filter((column) => !scriptColumns.includes(column))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }
}

TableChain.columnSet = columnSet
TableChain.tableName = tableName
