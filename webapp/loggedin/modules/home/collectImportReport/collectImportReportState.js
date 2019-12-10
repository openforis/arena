import * as R from 'ramda'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import * as HomeState from '../homeState'

export const stateKey = 'collectImportReport'
export const getState = R.pipe(HomeState.getState, R.propOr({}, stateKey))

const keys = {
  items: 'items',
  rowsScrollTop: 'rowsScrollTop',
}

// ====== READ
export const getItems = R.pipe(getState, R.propOr([], keys.items))

export const getRowsScrollTop = R.pipe(getState, R.propOr(null, keys.rowsScrollTop))

// ====== UPDATE
export const assocItems = R.assoc(keys.items)

export const assocRowsScrollTop = R.assoc(keys.rowsScrollTop)

export const updateItem = item => state => {
  const items = R.prop(keys.items, state)
  return R.pipe(
    R.findIndex(R.propEq(CollectImportReportItem.keys.id, CollectImportReportItem.getId(item))),
    index => R.update(index, item, items),
    itemsUpdate => assocItems(itemsUpdate)(state),
  )(items)
}
