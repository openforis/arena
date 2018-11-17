import * as R from 'ramda'

const home = 'home'

export const getNewSurvey = R.pipe(
  R.path([home, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

export const getSurveys = R.pathOr([], [home, 'surveys'])