import * as A from '@core/arena'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as User from '@core/user/user'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'

import SystemError from '@core/systemError'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as UserService from '../service/userService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import { UserExportService } from '../service/userExportService'

export const init = (app) => {
  // ==== CREATE

  app.post('/survey/:surveyId/users/invite', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey, repeatInvitation = false } = Request.getParams(req)
      const invitation = Request.getBody(req)

      if (!repeatInvitation) {
        const validation = await UserValidator.validateInvitation(invitation)

        if (!Validation.isValid(validation)) {
          res.json({ errorKey: 'appErrors.userInvalid' })
          return
        }
      }

      const user = Request.getUser(req)
      const serverUrl = Request.getServerUrl(req)
      try {
        const { skippedEmails } = await UserService.inviteUsers({
          user,
          surveyId,
          surveyCycleKey,
          invitation,
          serverUrl,
          repeatInvitation,
        })
        res.json({ skippedEmails })
      } catch (e) {
        const errorKey = e.key || 'appErrors.generic'
        const errorParams = e.params || { text: e.message }
        res.json({ errorKey, errorParams })
      }
    } catch (error) {
      next(error)
    }
  })

  app.post('/user/request-access', async (req, res, next) => {
    try {
      const userAccessRequest = Request.getBody(req)
      const serverUrl = Request.getServerUrl(req)

      const { error, errorParams, requestInserted } = await UserService.insertUserAccessRequest({
        userAccessRequest,
        serverUrl,
      })
      res.json({ error, errorParams, requestInserted })
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/user/accept-request-access',
    AuthMiddleware.requireCanEditAccessRequestsPermission,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const accessRequestAccept = Request.getBody(req)
        const serverUrl = Request.getServerUrl(req)

        try {
          const { survey, userInvited, validation } = await UserService.acceptUserAccessRequest({
            user,
            accessRequestAccept,
            serverUrl,
          })
          res.json({ survey, userInvited, validation })
        } catch (e) {
          const errorKey = e.key || 'appErrors.generic'
          const errorParams = e.params || { text: e.message }
          res.json({ errorKey, errorParams })
        }
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== READ

  const _getUser = async (req, res) => {
    const { userUuid } = Request.getParams(req)
    const user = await UserService.fetchUserByUuid(userUuid)
    // show private info only if fetching the same user of the request
    const userResult = User.isEqual(Request.getUser(req))(user) ? user : User.dissocPrivateProps(user)
    res.json(userResult)
  }

  app.get('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserViewPermission, async (req, res, next) => {
    try {
      await _getUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.get('/user/:userUuid', AuthMiddleware.requireUserViewPermission, async (req, res, next) => {
    try {
      await _getUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.get('/user/:userUuid/surveys', AuthMiddleware.requireUsersAllViewPermission, async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)
      const userSearch = await UserService.fetchUserByUuid(userUuid)
      const surveys = await SurveyManager.fetchUserSurveysInfo({ user: userSearch })
      res.json({ surveys })
    } catch (error) {
      next(error)
    }
  })

  app.get('/users/count', AuthMiddleware.requireUsersAllViewPermission, async (req, res, next) => {
    try {
      const count = await UserService.countUsers()
      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get('/users', AuthMiddleware.requireUsersAllViewPermission, async (req, res, next) => {
    try {
      const { offset, limit, sortBy, sortOrder } = Request.getParams(req)

      const list = await UserService.fetchUsers({ offset, limit, sortBy, sortOrder })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/users/export', AuthMiddleware.requireUsersAllViewPermission, async (_req, res, next) => {
    try {
      const fileName = `users_${DateUtils.nowFormatDefault()}.csv`
      Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

      await UserExportService.exportUsersIntoStream({ outputStream: res })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/users/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const count = await UserService.countUsersBySurveyId(surveyId)
      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/users', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, offset, limit } = Request.getParams(req)

      const list = await UserService.fetchUsersBySurveyId({ user, surveyId, offset, limit })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get(
    '/survey/:surveyId/user/:userUuid/resetpasswordurl',
    AuthMiddleware.requireUserInvitePermission,
    async (req, res, next) => {
      try {
        const { surveyId, userUuid } = Request.getParams(req)
        const serverUrl = Request.getServerUrl(req)
        const url = await UserService.fetchResetPasswordUrl({ serverUrl, surveyId, userUuid })
        res.json(url)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get('/user/:userUuid/profilePicture', AuthMiddleware.requireUserViewPermission, async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)

      const profilePicture = await UserService.fetchUserProfilePicture(userUuid)

      // Ensure we don't need to make duplicate requests by caching the profile picture for a small instant.
      // The value of 3 seconds is chosen as the smallest amount of time it takes for a user to switch to
      // a new profile picture, ensuring they always see their own newest picture.
      res.set('Cache-Control', 'private, max-age=3')

      if (profilePicture) {
        res.end(profilePicture, 'binary')
      } else {
        res.end()
      }
    } catch (error) {
      next(error)
    }
  })

  // ==== USER ACCESS REQUEST

  app.get(
    '/users/users-access-request',
    AuthMiddleware.requireCanViewAccessRequestsPermission,
    async (req, res, next) => {
      try {
        const { offset, limit } = Request.getParams(req)

        const list = await UserService.fetchUserAccessRequests({ offset, limit })

        res.json({ list })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/users/users-access-request/export',
    AuthMiddleware.requireUsersAllViewPermission,
    async (_req, res, next) => {
      try {
        const fileName = `user_access_requests_${DateUtils.nowFormatDefault()}.csv`
        Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

        await UserService.exportUserAccessRequestsIntoStream({ outputStream: res })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/users/users-access-request/count',
    AuthMiddleware.requireCanViewAccessRequestsPermission,
    async (_req, res, next) => {
      try {
        const count = await UserService.countUserAccessRequests()

        res.json({ count })
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== UPDATE

  const _updateUser = async (req, res) => {
    const body = Request.getBody(req)
    const { user: userToUpdateString } = body
    const userToUpdate = A.parse(userToUpdateString)
    const validation = await UserValidator.validateUser(userToUpdate)

    if (!Validation.isValid(validation)) {
      throw new SystemError('appErrors.userInvalid')
    }

    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)
    const fileReq = Request.getFile(req)

    const updatedUser = await UserService.updateUser(user, surveyId, userToUpdate, fileReq)

    res.json(updatedUser)
  }

  app.put('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserEditPermission, async (req, res, next) => {
    try {
      await _updateUser(req, res)
    } catch (error) {
      next(error)
    }
  })

  app.put('/user/:userUuid', AuthMiddleware.requireUserEditPermission, async (req, res, next) => {
    try {
      await _updateUser(req, res)
    } catch (error) {
      next(error)
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
    } catch (error) {
      next(error)
    }
  })

  app.post('/user/change-password', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const passwordChangeForm = Request.getBody(req)

      const validation = await UserService.updateUserPassword({ user, passwordChangeForm })

      res.json({ validation })
    } catch (error) {
      next(error)
    }
  })

  // ==== DELETE
  app.delete('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserRemovePermission, async (req, res, next) => {
    try {
      const { surveyId, userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUser({ user, userUuidToRemove: userUuid, surveyId })

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
