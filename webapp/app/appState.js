import * as R from 'ramda'

const app = 'app'

export const getNewSurvey = R.pipe(
  R.path([app, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)