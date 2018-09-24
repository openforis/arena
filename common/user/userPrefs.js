const R = require('ramda')
const prefs = 'prefs'

const userPrefNames = {
  survey: 'survey',
}

const getUserPrefSurveyId = R.path([prefs, userPrefNames.survey])

const setUserPref = (name, value) => R.assocPath([prefs, name], value)

module.exports = {
  userPrefNames,

  getUserPrefSurveyId,

  setUserPref,
}