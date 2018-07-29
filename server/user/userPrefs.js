const R = require('ramda')

const survey = 'survey'

const getSurvey = R.path(['prefs',survey])

module.exports = {
  survey,
  getSurvey,
}