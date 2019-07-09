import * as R from 'ramda'

import * as HomeState from '../homeState'

export const stateKey = 'surveyCreate'

export const getState = R.pipe(
  HomeState.getState,
  R.prop(stateKey)
)

export const getNewSurvey = R.pipe(
  getState,
  R.propOr(
    { name: '', label: '', lang: 'en', validation: {} },
    'newSurvey'
  )
)