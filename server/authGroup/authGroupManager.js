const R = require('ramda')

const UnauthorizedError = require('./unauthorizedError')

const {canEditSurvey} = require('../../common/auth/authManager')
const {getSurveyById} = require('../survey/surveyRepository')

const checkPermission = fn => async (user, surveyId) => {
  if (!fn(user, await getSurveyById(surveyId))) {
    throw new UnauthorizedError(`User ${user.name} is not authorized. surveyId: ${surveyId}, permission: ${fn.permissionName}`)
  }
}

const checkEditSurvey = checkPermission(canEditSurvey)

module.exports = {
  checkEditSurvey,
}
