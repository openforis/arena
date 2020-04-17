import Table from '@server/db/table'

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

class TableChain extends Table {
  constructor() {
    super('processing_chain', columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== columnSet.scriptCommon)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }
}

export default new TableChain()
