import * as R from 'ramda'

export const getCurrentSurvey = R.path(['app', 'survey'])

export const getCurrentSurveyId = R.pipe(
  getCurrentSurvey,
  R.prop('id'),
)

export const getNewSurvey = R.pipe(
  R.path(['survey', 'newSurvey']),
  R.defaultTo({name: '', label: ''})
)
