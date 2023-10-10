import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'

import * as Log from '@server/log/log'
import * as SurveyService from '../../survey/service/surveyService'
import * as UserService from '../../user/service/userService'
import * as RecordService from '../../record/service/recordService'
import * as FileService from '../../record/service/fileService'

const Logger = Log.getLogger('AuthAPI')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById({ surveyId, draft: false, validate: false })
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById({ surveyId, draft: true, validate: true })
      survey = Survey.assocFilesStatistics(await FileService.fetchFilesStatistics({ surveyId }))(survey)
    }
    sendResponse(res, user, survey)
  } catch (error) {
    Logger.error(`error loading survey with id ${surveyId}: ${error.toString()}`)
    // Survey not found with user pref
    // removing user pref
    const _user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefs(_user))
  }
}

export const init = (app) => {
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

      req.logout((err) => {
        if (err) {
          return next(err)
        }
        Response.sendOk(res)
      })
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
}
