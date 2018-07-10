const passport = require('passport')
const {sendOkResp} = require('../response')

const authenticationSuccessful = (req, res, next, user) =>
  req.logIn(user, err => {
    if (err)
      next(err)
    else {
      req.session.save(() => res.json({user}))
    }
  })


module.exports.init = app => {

  app.get('/auth/user', (req, res) => {
    res.json({user: req.user})
  })

  app.post('/auth/logout', (req, res) => {
    req.logout()
    sendOkResp(res)
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