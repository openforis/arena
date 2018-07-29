const passport = require('passport')

const {sendOk} = require('../response')

const userPref = require('./../user/userPrefs')
const {getSurveyById} = require('../survey/surveyRepository')

const sendUser = async (res, user) => {
  const surveyId = userPref.getSurvey(user)

  const survey = surveyId
    ? await getSurveyById(surveyId)
    : null

  res.json({
    user,
    survey
  })
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