const R = require('ramda')

const userPrefNames = {
  survey: 'survey',
}

const getUserPrefSurveyId = R.path(['prefs', userPrefNames.survey])

module.exports = {
  userPrefNames,

  getUserPrefSurveyId,
}