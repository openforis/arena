// const passport = require('passport')

const { sendOk } = require('../../../utils/response')

const { userPrefNames, getUserPrefSurveyId } = require('../../../../common/user/userPrefs')

const AuthManager = require('../../../../common/auth/authManager')
const SurveyManager = require('../../survey/manager/surveyManager')
const UserService = require('../../user/service/userService')
const RecordService = require('../../record/service/recordService')

const Survey = require('../../../../common/survey/survey')

const jwt = require('../../../system/jwt')

const { findUserByUsername } = require('../../../modules/user/manager/userManager')

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

// const authenticationSuccessful = (req, res, next, user) =>
//   req.logIn(user, err => {
//     if (err)
//       next(err)
//     else {
//       req.session.save(() => sendUser(res, user))
//     }
//   })

module.exports.init = app => {

  app.get('/auth/user', async (req, res) => {
    // sendUser(res, req.user)
    // TODO middleware
    const authHeader = req.headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length)

      const decoded = jwt.decode(token)

      const username = decoded.payload.username
      const user = await findUserByUsername(username)

      sendUser(res, user)
    }
  })

  app.post('/auth/logout', (req, res) => {
    // before logout checkOut record if there's an opened thread
    const { user } = req
    RecordService.terminateUserThread(user.id)

    req.logout()
    sendOk(res)
  })

  // app.post('/auth/login', (req, res, next) => {

  //   passport.authenticate('local', (err, user, info) => {

  //     if (err)
  //       return next(err)
  //     else if (!user)
  //       res.json(info)
  //     else
  //       authenticationSuccessful(req, res, next, user)

  //   })(req, res, next)

  // })
}