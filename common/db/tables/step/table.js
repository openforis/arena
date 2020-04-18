import * as SQL from '../../sql'

export const name = 'processing_step'
export const alias = SQL.createAlias(name)
const addAlias = (...columnNames) => SQL.addAlias(alias, ...columnNames)

const columnSet = {
  uuid: 'uuid',
  chainUuid: 'processing_chain_uuid',
  index: 'index',
  props: 'props',
}
const _columns = Object.values(columnSet)
export const columns = addAlias(..._columns)

export const columnUuid = addAlias(columnSet.uuid)[0]
export const columnChainUuid = addAlias(columnSet.chainUuid)[0]
export const columnIndex = addAlias(columnSet.index)[0]
