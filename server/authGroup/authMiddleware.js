const R = require('ramda')

const {getRestParam} = require('../serverUtils/request')
const {sendErr} = require('../serverUtils/response')
const {fetchSurveyById} = require('../survey/surveyManager')

const {canEditSurvey} = require('../../common/auth/authManager')
const UnauthorizedError = require('./unauthorizedError')

const requirePermission = (fn) =>
  async (req, res, next) => {
    const user = req.user
    const survey = await fetchSurveyById(getRestParam(req, 'surveyId'))

    if (fn(user, survey)) {
      next()
    } else {
      sendErr(res, new UnauthorizedError(`User ${user.name} is not authorized`))
    }
  }

const requireEditPermission = requirePermission(canEditSurvey)

module.exports = {
  requireEditPermission,
}
