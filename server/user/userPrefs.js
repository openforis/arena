const R = require('ramda')

const userPrefNames = {
  survey: 'survey',
}

const getSurvey = R.path(['prefs', userPrefNames.survey])

module.exports = {
  userPrefNames,

  getSurvey,
}