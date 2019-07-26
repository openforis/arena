import * as TableViewsState from '../../../tableViews/tableViewsState'

export const keys = {
  records: 'records',
  nodeDefKeys: 'nodeDefKeys',

}

export const getNodeDefKeys = TableViewsState.getModuleProp(keys.records, keys.nodeDefKeys, [])
