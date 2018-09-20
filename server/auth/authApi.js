const passport = require('passport')
const R = require('ramda')

const {sendOk} = require('../serverUtils/response')

const {userPrefNames, getUserPrefSurveyId} = require('../../common/user/userPrefs')
const {getSurveyById} = require('../survey/surveyRepository')
const {deleteUserPref} = require('../user/userRepository')
const {validateSurvey} = require('../survey/surveyValidator')

const sendResponse = (res, user, survey = null) => res.json({user, survey})

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    const survey = await getSurveyById(surveyId, true)

    sendResponse(
      res,
      user,
      {...survey, validation: await validateSurvey(survey)}
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