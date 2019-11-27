import * as R from 'ramda'

import * as HomeState from '../homeState'

export const stateKey = 'surveyCreate'

export const keys = {
  newSurvey: 'newSurvey',
}

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

export const newSurveyDefault = {
  name: '',
  label: '',
  lang: 'en',
  validation: {},
}

export const getNewSurvey = R.pipe(
  getState,
  R.propOr(newSurveyDefault, keys.newSurvey),
)
