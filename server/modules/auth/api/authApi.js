const Loggger = require('../../../log/log').getLogger('AuthAPI')
const Request = require('../../../utils/request')
const Response = require('../../../utils/response')
const Jwt = require('../../../utils/jwt')

const Survey = require('../../../../common/survey/survey')
const User = require('../../../../common/user/user')
const Authorizer = require('../../../../common/auth/authorizer')

const SurveyService = require('../../survey/service/surveyService')
const UserService = require('../../user/service/userService')
const RecordService = require('../../record/service/recordService')
const AuthService = require('../service/authService')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById(surveyId, false, false)
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById(surveyId, true, true)
    }
    sendResponse(res, user, survey)
  } catch (e) {
    Loggger.error(`error loading survey with id ${surveyId}: ${e.toString()}`)
    // survey not found with user pref
    // removing user pref
    user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefs(user))
  }
}

module.exports.init = app => {

  app.get('/auth/user', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyId = User.getPrefSurveyCurrent(user)

      surveyId
        ? await sendUserSurvey(res, user, surveyId)
        : sendResponse(res, user)
    } catch (err) {
      next(err)
    }
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // before logout checkOut record if there's an opened thread
      const socketId = Request.getSocketId(req)
      RecordService.dissocSocketFromRecordThread(socketId)

      const token = req.headers.authorization.substring(Jwt.bearerPrefix.length)

      await AuthService.blacklistToken(token)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

}