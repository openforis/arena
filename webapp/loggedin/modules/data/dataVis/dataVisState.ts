import * as R from 'ramda'
import * as DataState from '../dataState'

export const getState: (x: any) => any = R.pipe(DataState.getState, R.prop('dataVis'))

