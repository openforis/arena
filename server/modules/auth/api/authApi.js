const Request = require('../../../utils/request')
const { sendOk } = require('../../../utils/response')

const Log = require('../../../log/log')
const logger = Log.getLogger('AuthAPI')

const Survey = require('../../../../common/survey/survey')
const User = require('../../../../common/user/user')
const { userPrefNames, getUserPrefSurveyId } = require('../../../../common/user/userPrefs')
const Authorizer = require('../../../../common/auth/authorizer')

const SurveyManager = require('../../survey/manager/surveyManager')
const UserService = require('../../user/service/userService')
const RecordService = require('../../record/service/recordService')

const AuthService = require('../service/authService')
const Jwt = require('../jwt')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyManager.fetchSurveyById(surveyId, false, false)

    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyManager.fetchSurveyById(surveyId, true, true)
    }

    sendResponse(
      res,
      user,
      survey,
    )
  } catch (e) {
    logger.error(`error loading survey with id ${surveyId}: ${e.toString()}`)
    // survey not found with user pref
    // removing user pref
    sendResponse(
      res,
      await UserService.deleteUserPref(user, userPrefNames.survey)
    )
  }
}

const sendUser = async (res, user) => {
  const surveyId = getUserPrefSurveyId(user)

  surveyId
    ? await sendUserSurvey(res, user, surveyId)
    : sendResponse(res, user)
}

module.exports.init = app => {

  app.get('/auth/user', async (req, res, next) => {
    try {
      await sendUser(res, Request.getUser(req))
    } catch (err) {
      next(err)
    }
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // before logout checkOut record if there's an opened thread
      const user = Request.getUser(req)
      RecordService.dissocUserFromRecordThread(User.getUuid(user))

      const token = req.headers.authorization.substring(Jwt.bearerPrefix.length)

      await AuthService.blacklistToken(token)

      sendOk(res)
    } catch (err) {
      next(err)
    }
  })
}