import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect, GetSelectParams } from './select'

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

export default class TableChain extends TableSurvey {
  static readonly columnSet = columnSet
  static readonly tableName = tableName

  private readonly _columnsNoScript: string[]
  getSelect: (params: GetSelectParams) => string

  constructor(surveyId: number) {
    super(surveyId, tableName, columnSet)
    const scriptColumns = new Set(scriptColumnNames.map((col) => this.getColumn(col)))
    this._columnsNoScript = this.columns.filter((column) => !scriptColumns.has(column))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript(): string[] {
    return this._columnsNoScript
  }
}
