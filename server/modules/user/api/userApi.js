const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const UserService = require('../service/userService')

const User = require('../../../../common/user/user')
const UserValidator = require('../../../../common/user/userValidator')
const Validator = require('../../../../common/validation/validator')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const { user } = req

      const { surveyId, email, groupUuid } = Request.getParams(req)
      const validation = await UserValidator.validateNewUser(req.body)

      if (!Validator.isValidationValid(validation)) {
        throw new SystemError('invalidUser')
      }

      await UserService.inviteUser(user, surveyId, email, groupUuid)
      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  // ==== READ

  app.get('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserViewPermission, async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)
      const user = await UserService.fetchUserByUuid(userUuid)

      res.json(user)
    } catch (err) {
      next(err)
    }
  })

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
      const { user } = req
      const { surveyId, offset, limit } = Request.getParams(req)

      const list = await UserService.fetchUsersBySurveyId(user, surveyId, offset, limit)

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

  app.put('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserEditPermission, async (req, res, next) => {
    try {
      const validation = await UserValidator.validateUser(req.body)

      if (!Validator.isValidationValid(validation)) {
        throw new SystemError('invalidUser')
      }

      const { user } = req
      const { surveyId, userUuid, name, groupUuid } = Request.getParams(req)
      await UserService.updateUser(user, surveyId, userUuid, name, groupUuid)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  app.post('/user/:userUuid/pref/:name/:value', async (req, res, next) => {
    try {
      const { user } = req

      const { userUuid, name, value } = Request.getParams(req)

      if (User.getUuid(user) !== userUuid) {
        throw new SystemError('userNotAllowedToChangePref')
      }

      await UserService.updateUserPref(user, name, value)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }

  })
}
