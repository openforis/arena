const { sendOk } = require('../../../utils/response')

const { userPrefNames, getUserPrefSurveyId } = require('../../../../common/user/userPrefs')

const Jwt = require('../../../system/jwt')

const AuthManager = require('../../../../common/auth/authManager')
const SurveyManager = require('../../survey/manager/surveyManager')
const UserService = require('../../user/service/userService')
const RecordService = require('../../record/service/recordService')
const AuthService = require('../../auth/service/authService')

const Survey = require('../../../../common/survey/survey')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyManager.fetchSurveyById(surveyId, false, false)

    if (AuthManager.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyManager.fetchSurveyById(surveyId, true, true)
    }

    sendResponse(
      res,
      user,
      survey,
    )
  } catch (e) {
    console.log(`error loading survey with id ${surveyId}`, e)
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

  app.get('/auth/user', (req, res) => {
    sendUser(res, req.user)
  })

  app.post('/auth/logout', (req, res) => {
    // before logout checkOut record if there's an opened thread
    const { user } = req
    RecordService.terminateUserThread(user.id)

    const token = req.headers.authorization.substring(7)
    AuthService.blacklistToken(token, Jwt.getExpiration(token))

    sendOk(res)
  })
}