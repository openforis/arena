import * as R from 'ramda'
import * as DataVisState from '@webapp/loggedin/modules/data/dataVis/state'

export const getState = R.pipe(DataVisState.getState, R.prop('query'))
