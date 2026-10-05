export * as TablesActions from './actions'
import TablesReducer from './reducer'
export * as TablesState from './state'

export { TablesReducer }
export { useTableMaxRows, useTableSort, useTableVisibleColumns } from './hooks'
