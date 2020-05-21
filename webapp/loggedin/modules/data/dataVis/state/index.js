import * as R from 'ramda'
import * as DataState from '@webapp/loggedin/modules/data/state'

export const getState = R.pipe(DataState.getState, R.prop('dataVis'))
