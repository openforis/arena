import * as R from 'ramda'
import * as HomeState from '../homeState'

export const getState = R.pipe(HomeState.getState, R.prop('collectImportReport'))

export const updateItem = item =>
  items => {
    const index = R.findIndex(R.propEq('id', item.id))(items)
    return R.update(index, item)(items)
  }

