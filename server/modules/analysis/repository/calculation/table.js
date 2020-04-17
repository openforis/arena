import Table from '@server/db/table'

export const name = 'processing_step_calculation'

const columnSet = {
  uuid: 'uuid',
  stepUuid: 'processing_step_uuid',
  nodeDefUuid: 'node_def_uuid',
  index: 'index',
  props: 'props',
  script: 'script',
}

class TableCalculation extends Table {
  constructor() {
    super('processing_step_calculation', columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== columnSet.script)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }
}

export default new TableCalculation()
