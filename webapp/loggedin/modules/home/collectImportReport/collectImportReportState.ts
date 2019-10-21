import * as R from 'ramda'
import * as HomeState from '../homeState'

export const stateKey = 'collectImportReport'

export const getState: (x: any) => any = R.pipe(HomeState.getState, R.prop(stateKey))

export const updateItem = item =>
  items => {
    const index = R.findIndex(R.propEq('id', item.id))(items)
    return R.update(index, item)(items)
  }

