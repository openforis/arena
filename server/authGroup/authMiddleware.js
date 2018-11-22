const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {fetchSurveyById} = require('../survey/surveyManager')

const {canEditSurvey} = require('../../common/auth/authManager')

const UnauthorizedError = require('./unauthorizedError')

const requireSurveyPermission = (permissionFn) =>
  async (req, res, next) => {
    const {user} = req
    const survey = await fetchSurveyById(getRestParam(req, 'surveyId'))
    if (permissionFn(user, survey)) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

module.exports = {
  requireSurveyEditPermission: requireSurveyPermission(canEditSurvey),
}
