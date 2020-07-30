import { AppReducer, AppState } from '@webapp/store/app'

import component from './index'

const reducers = [
  { name: AppState.stateKey, fn: AppReducer },
]

export { component, reducers }
