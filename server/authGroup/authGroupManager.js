const R = require('ramda')

const UnauthorizedError = require('./unauthorizedError')

const Survey = require('../../common/survey/survey')
const {canEditSurvey} = require('../../common/auth/authManager')
const {fetchSurveyById} = require('../survey/surveyManager')

const checkPermission = fn => async (user, surveyId) => {
  const survey = await fetchSurveyById(surveyId)
  if (!fn(user, Survey.getSurveyInfo(survey))) {
    throw new UnauthorizedError(`User ${user.name} is not authorized. surveyId: ${surveyId}, permission: ${fn.permissionName}`)
  }
}

const checkEditSurvey = checkPermission(canEditSurvey)

module.exports = {
  checkEditSurvey,
}
