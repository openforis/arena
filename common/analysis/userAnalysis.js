import * as R from 'ramda'

const keys = {
  password: 'password',
}

export const getName = (surveyId) => `arena_analysis_${surveyId}`
export const getPassword = R.prop(keys.password)
