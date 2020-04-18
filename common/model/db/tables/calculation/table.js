import * as SQL from '../../sql'

export const name = 'processing_step_calculation'
export const alias = SQL.createAlias(name)
const addAlias = (...columnNames) => SQL.addAlias(alias, ...columnNames)

const columnSet = {
  uuid: 'uuid',
  stepUuid: 'processing_step_uuid',
  nodeDefUuid: 'node_def_uuid',
  index: 'index',
  props: 'props',
  script: 'script',
}
const _columns = Object.values(columnSet)
const _columnsNoScript = _columns.filter((column) => column !== columnSet.script)
export const columns = addAlias(..._columns)
export const columnsNoScript = addAlias(..._columnsNoScript)

export const columnUuid = addAlias(columnSet.uuid)[0]
export const columnStepUuid = addAlias(columnSet.stepUuid)[0]
export const columnIndex = addAlias(columnSet.index)[0]
