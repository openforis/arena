import * as R from 'ramda'
import * as DataVisState from '@webapp/views/App/views/Data/Explorer/state'

export const getState = R.pipe(DataVisState.getState, R.prop('query'))
