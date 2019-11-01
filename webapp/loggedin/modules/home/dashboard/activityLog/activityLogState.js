import * as R from 'ramda'

import * as HomeState from '../../homeState'

export const stateKey = 'activityLog'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))
