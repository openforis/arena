import * as R from 'ramda'

import * as HomeState from '../homeState'

export const getState = R.pipe(
  HomeState.getState,
  R.prop('surveyCreate')
)

export const getNewSurvey = R.pipe(
  getState,
  R.propOr(
    { name: '', label: '', lang: 'en', validation: {} },
    'newSurvey'
  )
)