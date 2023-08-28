import * as R from 'ramda'
import * as SurveyState from '../state'

export const stateKey = 'status'

const keys = {
  defsFetched: 'defsFetched',
  defsDraftFetched: 'defsDraftFetched',
}

const getStatus = R.pipe(SurveyState.getSurvey, R.propOr(false, stateKey))

const _areDefsFetched = R.pipe(getStatus, R.propEq(keys.defsFetched, true))
const _areDefsDraftFetched = R.pipe(getStatus, R.propEq(keys.defsDraftFetched, true))

export const areDefsFetched = (draft) => (state) => draft ? _areDefsDraftFetched(state) : _areDefsFetched(state)

export const assocDefsFetched = (draft) => (state) =>
  draft
    ? R.pipe(R.assoc(keys.defsDraftFetched, true), R.assoc(keys.defsFetched, false))(state)
    : R.pipe(R.assoc(keys.defsFetched, true), R.assoc(keys.defsDraftFetched, false))(state)

export const resetDefsFetched = R.pipe(R.assoc(keys.defsFetched, false), R.assoc(keys.defsDraftFetched, false))
