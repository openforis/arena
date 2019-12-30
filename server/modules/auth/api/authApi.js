import * as passport from 'passport'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'

import * as Log from '@server/log/log'
import * as SurveyService from '../../survey/service/surveyService'
import * as UserService from '../../user/service/userService'
import * as RecordService from '../../record/service/recordService'

const Logger = Log.getLogger('AuthAPI')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById(surveyId, false, false)
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById(surveyId, true, true)
    }

    sendResponse(res, user, survey)
  } catch (error) {
    Logger.error(`error loading survey with id ${surveyId}: ${error.toString()}`)
    // Survey not found with user pref
    // removing user pref
    user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefs(user))
  }
}

const sendUser = async (res, user) => {
  const surveyId = User.getPrefSurveyCurrent(user)

  if (surveyId) await sendUserSurvey(res, user, surveyId)
  else sendResponse(res, user)
}

const authenticationSuccessful = (req, res, next, user) =>
  req.logIn(user, err => {
    if (err) next(err)
    else {
      req.session.save(() => sendUser(res, user))
    }
  })

export const init = app => {
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

  app.post('/auth/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err)
      if (!user) res.json(info)
      else authenticationSuccessful(req, res, next, user)
    })(req, res, next)
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // Before logout checkOut record if there's an opened thread
      const socketId = Request.getSocketId(req)
      RecordService.dissocSocketFromRecordThread(socketId)

      req.logout()

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/forgot-password', async (req, res, next) => {
    try {
      const { email } = Request.getParams(req)
      const serverUrl = Request.getServerUrl(req)
      const data = await UserService.generateForgotPasswordUuid(email, serverUrl)
      res.json(data)
    } catch (error) {
      next(error)
    }
  })
}
