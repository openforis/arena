const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const UserService = require('../service/userService')

const User = require('../../../../core/user/user')
const UserValidator = require('../../../../core/user/userValidator')
const Validation = require('../../../../core/validation/validation')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const { surveyId, email, groupUuid } = Request.getParams(req)
      const validation = await UserValidator.validateInvitation(Request.getBody(req))

      if (!Validation.isValid(validation)) {
        throw new SystemError('invalidUser')
      }

      const serverUrl = Request.getServerUrl(req)
      await UserService.inviteUser(user, surveyId, email, groupUuid, serverUrl)
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
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)

      const count = await UserService.countUsersBySurveyId(user, surveyId)
      res.json(count)

    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/users', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, offset, limit } = Request.getParams(req)

      const list = await UserService.fetchUsersBySurveyId(user, surveyId, offset, limit)

      res.json({ list })
    } catch (err) {
      next(err)
    }
  })

  app.get('/user/:userUuid/profilePicture', async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)

      const profilePicture = await UserService.fetchUserProfilePicture(userUuid)
      if (profilePicture) {
        res.end(profilePicture, 'binary')
      } else {
        res.sendFile(`${__dirname}/avatar.png`)
      }
    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/user/:userUuid/accept-invitation', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { userUuid, name } = Request.getParams(req)

      await UserService.acceptInvitation(user, userUuid, name)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

  app.put('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserEditPermission, async (req, res, next) => {
    try {
      const validation = await UserValidator.validateUser(Request.getBody(req))

      if (!Validation.isValid(validation)) {
        throw new SystemError('invalidUser')
      }

      const user = Request.getUser(req)
      const { surveyId, userUuid, name, email, groupUuid } = Request.getParams(req)

      const fileReq = Request.getFile(req)

      const updatedUser = await UserService.updateUser(user, surveyId, userUuid, name, email, groupUuid, fileReq)

      res.json(updatedUser)
    } catch (err) {
      next(err)
    }
  })

  app.post('/user/:userUuid/prefs', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userToUpdate = Request.getBody(req)

      if (!User.isEqual(userToUpdate)(user)) {
        throw new SystemError('userNotAllowedToChangePref')
      }

      await UserService.updateUserPrefs(userToUpdate)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }

  })

  // ==== DELETE
  app.delete('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserRemovePermission, async (req, res, next) => {
    try {
      const { surveyId, userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUser(user, surveyId, userUuid)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

}
