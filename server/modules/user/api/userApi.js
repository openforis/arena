const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const UserService = require('../service/userService')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', async (req, res, next) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const email = Request.getRestParam(req, 'email')
      const groupId = Request.getRestParam(req, 'groupId')

      await UserService.inviteUser(surveyId, email, groupId)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/users/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')

      const count = await UserService.countUsersBySurveyId(surveyId)
      res.json(count)

    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/users', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit } = Request.getParams(req)

      const list = await UserService.fetchUsersBySurveyId(surveyId, offset, limit)

      res.json({ list })
    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.post('/user/:userId/pref/:name/:value', async (req, res, next) => {
    try {
      const { user } = req

      const { userId, name, value } = Request.getParams(req)

      if (user.id !== userId) {
        throw new SystemError('userNotAllowedToChangePref')
      }

      await UserService.updateUserPref(user, name, value)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }

  })
}
