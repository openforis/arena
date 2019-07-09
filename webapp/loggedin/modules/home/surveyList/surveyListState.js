import * as R from 'ramda'
import * as HomeState from '../homeState'

export const stateKey = 'surveyList'

const keys = {
  surveys: 'surveys',
}

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

export const assocSurveys = R.assoc(keys.surveys)

export const getSurveys = R.pipe(getState, R.propOr([], keys.surveys))