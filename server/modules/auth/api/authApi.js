import { ApiEndpoint } from '@openforis/arena-server'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'
import * as ProcessUtils from '@core/processUtils'

import * as Log from '@server/log/log'
import * as SurveyService from '../../survey/service/surveyService'
import * as UserService from '../../user/service/userService'
import * as RecordService from '../../record/service/recordService'
import * as QRCodeAuthService from '../service/qrCodeAuthService'

const Logger = Log.getLogger('AuthAPI')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById({ surveyId, draft: false, validate: false })
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById({ surveyId, draft: true, validate: true })
      survey = await SurveyService.fetchAndAssocStorageInfo({ survey })
    }
    sendResponse(res, user, survey)
  } catch (error) {
    Logger.error(`error loading survey with id ${surveyId}: ${error.toString()}`)
    // Survey not found with user pref
    // removing user pref
    const _user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefsAndFetchGroups(_user))
  }
}

export const init = (app) => {
  app.get('/api/version', async (_req, res, next) => {
    try {
      const packageJson = JSON.parse(await FileUtils.readFile('package.json'))
      const { version } = packageJson
      res.json({ version })
    } catch (error) {
      next(error)
    }
  })

  app.get('/auth/user', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyId = User.getPrefSurveyCurrent(user)

      if (surveyId) {
        await sendUserSurvey(res, user, surveyId)
      } else {
        sendResponse(res, user)
      }
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // Before logout checkOut record if there's an opened thread
      const socketId = Request.getSocketId(req)
      RecordService.dissocSocketFromUpdateThread(socketId)

      res.clearCookie('refreshToken', {
        httpOnly: true,
        path: ApiEndpoint.auth.tokenRefresh(),
        sameSite: 'strict',
        secure: ProcessUtils.isEnvProduction,
      })
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  // ===== RESET PASSWORD
  app.post('/auth/reset-password', async (req, res, next) => {
    try {
      const { email } = Request.getParams(req)
      const serverUrl = Request.getServerUrl(req)
      const { uuid, error } = await UserService.generateResetPasswordUuid(email, serverUrl)
      res.json({ uuid, error })
    } catch (error) {
      next(error)
    }
  })

  app.get('/auth/reset-password/:uuid', async (req, res, next) => {
    try {
      const { uuid } = Request.getParams(req)
      const user = await UserService.findResetPasswordUserByUuid(uuid)
      res.json({ user })
    } catch (error) {
      next(error)
    }
  })

  app.put('/auth/reset-password/:uuid', async (req, res, next) => {
    try {
      const { uuid, name, password, title } = Request.getParams(req)
      await UserService.resetPassword({ uuid, name, password, title })
      res.json({ result: true })
    } catch (error) {
      next(error)
    }
  })

  // ===== QR CODE LOGIN
  app.post('/auth/qr-code/generate', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { token, expiresAt } = await QRCodeAuthService.generateQRCodeToken(user)
      const serverUrl = Request.getServerUrl(req)
      const qrCodeUrl = `${serverUrl}/guest/qr-login?token=${token}`

      res.json({
        token,
        qrCodeUrl,
        expiresAt,
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/qr-code/validate', async (req, res, next) => {
    try {
      const { token } = Request.getParams(req)
      const result = await QRCodeAuthService.validateQRCodeToken(token)

      if (!result.valid) {
        return res.status(400).json({ error: result.error })
      }

      // Return user data for login
      const userWithGroups = await UserService.fetchUserWithGroups(result.user.uuid)
      res.json({ user: userWithGroups })
    } catch (error) {
      next(error)
    }
  })

  // QR Code Login endpoint - validates token and authenticates user with JWT
  app.get('/guest/qr-login', async (req, res, next) => {
    try {
      const { token } = req.query

      if (!token) {
        return res.redirect('/guest/login?error=missing_token')
      }

      const result = await QRCodeAuthService.validateQRCodeToken(token)

      if (!result.valid) {
        return res.redirect(`/guest/login?error=${encodeURIComponent(result.error)}`)
      }

      // Fetch user with groups
      const userWithGroups = await UserService.fetchUserWithGroups(result.user.uuid)

      // Generate JWT tokens using Arena's auth token service
      const { ServiceRegistry, ServiceType } = await import('@openforis/arena-core')
      const serviceRegistry = ServiceRegistry.getInstance()
      const authTokenService = serviceRegistry.getService(ServiceType.userAuthToken)

      const { authToken, refreshToken } = await authTokenService.createUserAuthTokens({
        userUuid: userWithGroups.uuid,
        props: { qrLogin: true },
      })

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken.token, {
        httpOnly: true,
        path: ApiEndpoint.auth.tokenRefresh(),
        sameSite: 'strict',
        secure: ProcessUtils.isEnvProduction,
        expires: refreshToken.expiresAt,
      })

      // Redirect to app with auth token in query param (will be picked up by the frontend)
      const redirectUrl = `/app/home?authToken=${authToken.token}`
      res.redirect(redirectUrl)
    } catch (error) {
      Logger.error('QR login error:', error)
      res.redirect('/guest/login?error=authentication_failed')
    }
  })

  // Clean up expired QR tokens periodically (can be called from a scheduled job)
  app.post('/auth/qr-code/cleanup', async (req, res, next) => {
    try {
      await QRCodeAuthService.cleanupExpiredTokens()
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
