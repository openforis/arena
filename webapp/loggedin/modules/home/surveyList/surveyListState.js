import * as R from 'ramda'
import * as HomeState from '../homeState'

export const stateKey = 'surveyList'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

const keys = {
  surveys: 'surveys'
}

// ==== surveys
export const assocSurveys = surveys => R.assoc(keys.surveys, surveys)

export const getSurveys = R.pipe(getState, R.propOr({}, keys.surveys))

// ==== reset state
export const resetState = assocSurveys({})
