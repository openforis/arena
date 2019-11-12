import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '../../auth/authApiMiddleware'

import * as UserService from '../service/userService'

import * as User from '@core/user/user'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'
import * as ProcessUtils from '@core/processUtils'

import SystemError from '@core/systemError'

export const init = app => {

  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const { surveyId, email, groupUuid, surveyCycleKey } = Request.getParams(req)
      const validation = await UserValidator.validateInvitation(Request.getBody(req))

      if (!Validation.isValid(validation)) {
        throw new SystemError('appErrors.userInvalid')
      }

      const serverUrl = Request.getServerUrl(req)
      await UserService.inviteUser(user, surveyId, surveyCycleKey, email, groupUuid, serverUrl)
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

      // Ensure we don't need to make duplicate requests by caching the profile picture for a small instant.
      // The value of 3 seconds is chosen as the smallest amount of time it takes for a user to switch to
      // a new profile picture, ensuring they always see their own newest picture.
      res.set('Cache-Control', 'private, max-age=3');

      if (profilePicture) {
        res.end(profilePicture, 'binary')
      } else {
        res.sendFile(`${__dirname}/avatar.png`, { root: ProcessUtils.ENV.arenaRoot })
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
        throw new SystemError('appErrors.userInvalid')
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

};

