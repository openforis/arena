const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const UserService = require('../service/userService')

const Validator = require('../../../../common/validation/validator')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const { user } = req

      const { surveyId, email, groupId } = Request.getParams(req)
      const validation = await UserService.validateNewUser(req.body)

      if (Validator.isValidationValid(validation)) {
        await UserService.inviteUser(user, surveyId, email, groupId)

        Response.sendOk(res)
      } else {
        throw new SystemError('invalidUser')
      }
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

  app.put('/user/:userUuid/name', async (req, res, next) => {
    try {
      const { user } = req
      const { userUuid, name } = Request.getParams(req)

      await UserService.updateUsername(user, userUuid, name)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

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
