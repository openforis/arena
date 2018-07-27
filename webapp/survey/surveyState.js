import * as R from 'ramda'

export const surveyState = {

  getNewSurvey: R.pipe(
    R.path(['survey', 'newSurvey']),
    R.defaultTo({name: '', label: ''})
  )

}

