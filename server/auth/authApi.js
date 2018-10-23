const passport = require('passport')

const {sendOk} = require('../serverUtils/response')

const {userPrefNames, getUserPrefSurveyId} = require('../../common/user/userPrefs')
const {fetchSurveyById} = require('../survey/surveyManager')
const {deleteUserPref} = require('../user/userRepository')

const sendResponse = (res, user, survey = null) => res.json({user, survey})

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    const draft = true //TODO

    const survey = await fetchSurveyById(surveyId, draft)

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
      await deleteUserPref(user, userPrefNames.survey)
    )
  }
}

const sendUser = async (res, user) => {
  const surveyId = getUserPrefSurveyId(user)

  surveyId
    ? await sendUserSurvey(res, user, surveyId)
    : sendResponse(res, user)
}

const authenticationSuccessful = (req, res, next, user) =>
  req.logIn(user, err => {
    if (err)
      next(err)
    else {
      req.session.save(() => sendUser(res, user))
    }
  })

module.exports.init = app => {

  app.get('/auth/user', (req, res) => {
    sendUser(res, req.user)
  })

  app.post('/auth/logout', (req, res) => {
    req.logout()
    sendOk(res)
  })

  app.post('/auth/login', (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {

      if (err)
        return next(err)
      else if (!user)
        res.json(info)
      else
        authenticationSuccessful(req, res, next, user)

    })(req, res, next)

  })
}