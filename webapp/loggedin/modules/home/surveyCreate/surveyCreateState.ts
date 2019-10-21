import * as R from 'ramda'

import * as HomeState from '../homeState'

export const stateKey = 'surveyCreate'

export const keys = {
  newSurvey: 'newSurvey'
}

export const getState: (x: any) => any = R.pipe(
  HomeState.getState,
  R.prop(stateKey)
)

export const newSurveyDefault = { name: '', label: '', lang: 'en', validation: {} }

export const getNewSurvey: (x: any) => any = R.pipe(
  getState,
  R.propOr(newSurveyDefault, keys.newSurvey)
)
