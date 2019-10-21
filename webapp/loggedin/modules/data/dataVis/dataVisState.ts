import * as R from 'ramda'
import * as DataState from '../dataState'

export const getState = R.pipe(DataState.getState, R.prop('dataVis'))

