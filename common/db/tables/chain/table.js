import * as SQL from '../../sql'

export const name = 'processing_chain'
export const alias = SQL.createAlias(name)
const addAlias = (...columnNames) => SQL.addAlias(alias, ...columnNames)

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
const _columns = Object.values(columnSet)
const _columnsNoScript = _columns.filter((column) => column !== columnSet.scriptCommon)
export const columns = addAlias(..._columns)
export const columnsNoScript = addAlias(..._columnsNoScript)

export const columnUuid = addAlias(columnSet.uuid)[0]
export const columnDateCreated = addAlias(columnSet.dateCreated)[0]
export const columnProps = addAlias(columnSet.props)[0]
