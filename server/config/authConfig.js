const R = require('ramda')
const passport = require('passport')

const localStrategy = require('./authConfigLocalStrategy')

const {findUserById} = require('../user/userRepository')

const authSetup = app => {
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use(localStrategy)

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (userId, done) => {
    const user = await findUserById(userId)
    done(null, user)
  })
}

const authenticationSuccessful = (req, res, next, user) =>
  req.logIn(user, err => {
    if (err)
      next(err)
    else
      req.session.save(() => res.send(`/app/a`))
  })

module.exports.init = app => {
  authSetup(app)

  //auth apis
  app.post('/auth/logout', (req, res) => {
    req.logout()
    res.json({})
  })

  app.post('/auth/login', (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {

      if (err)
        return next(err)
      else if (!user)
        res.send(info)
      else
        authenticationSuccessful(req, res, next, user)

    })(req, res, next)

  })

}
