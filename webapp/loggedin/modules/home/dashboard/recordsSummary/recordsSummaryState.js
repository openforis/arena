import * as R from 'ramda'
import * as HomeState from '../../homeState'

export const stateKey = 'recordsSummary'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

const keys = {
  from: 'from',
  to: 'to',
  counts: 'counts',
}

export const assocSummary = (from, to, counts) => R.pipe(
  R.assoc(keys.from, from),
  R.assoc(keys.to, to),
  R.assoc(keys.counts, counts),
)

export const getFrom = R.pipe(getState, R.prop(keys.from))
export const getTo = R.pipe(getState, R.prop(keys.to))
export const getCounts = R.pipe(getState, R.propOr([], keys.counts))
