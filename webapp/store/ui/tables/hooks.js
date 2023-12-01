import { useSelector } from 'react-redux'
import * as TablesState from './state'

export const useTableMaxRows = (module) => useSelector(TablesState.getMaxRows(module))

export const useTableVisibleColumns = (module) => useSelector(TablesState.getVisibleColumns(module))
