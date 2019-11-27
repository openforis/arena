import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as Jwt from '@server/utils/jwt'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyService from '../../survey/service/surveyService'
import * as UserService from '../../user/service/userService'
import * as RecordService from '../../record/service/recordService'
import * as AuthService from '../service/authService'

const sendResponse = (res, user, survey = null) => res.json({user, survey})

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById(surveyId, false, false)
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById(surveyId, true, true)
    }

    sendResponse(res, user, survey)
  } catch (error) {
    Loggger.error(`error loading survey with id ${surveyId}: ${error.toString()}`)
    // Survey not found with user pref
    // removing user pref
    user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefs(user))
  }
}

export const init = app => {
  app.get('/auth/user', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyId = User.getPrefSurveyCurrent(user)

      surveyId
        ? await sendUserSurvey(res, user, surveyId)
        : sendResponse(res, user)
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // Before logout checkOut record if there's an opened thread
      const socketId = Request.getSocketId(req)
      RecordService.dissocSocketFromRecordThread(socketId)

      const token = req.headers.authorization.substring(Jwt.bearerPrefix.length)

      await AuthService.blacklistToken(token)

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
