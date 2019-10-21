import * as R from 'ramda'
import * as HomeState from '../../homeState'

export const stateKey = 'recordsSummary'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

export const timeRanges = {
  _2Weeks: '2Weeks',
  _1Month: '1Month',
  _3Months: '3Months',
  _6Months: '6Months',
  _1Year: '1Year',

}

const keys = {
  from: 'from',
  to: 'to',
  counts: 'counts',
  timeRange: 'timeRange',
}

export const assocSummary = (timeRange, from, to, counts) => R.pipe(
  R.assoc(keys.timeRange, timeRange),
  R.assoc(keys.from, from),
  R.assoc(keys.to, to),
  R.assoc(keys.counts, counts),
)

export const getFrom = R.pipe(getState, R.prop(keys.from))
export const getTo = R.pipe(getState, R.prop(keys.to))
export const getCounts = R.pipe(getState, R.propOr([], keys.counts))
export const getTimeRange = R.pipe(getState, R.propOr(timeRanges._2Weeks, keys.timeRange))
