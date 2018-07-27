import * as R from 'ramda'

export const surveyState = {

  getCurrentSurvey: R.path(['survey', 'current']),

  getNewSurvey: R.pipe(
    R.path(['survey', 'newSurvey']),
    R.defaultTo({name: '', label: ''})
  )

}

