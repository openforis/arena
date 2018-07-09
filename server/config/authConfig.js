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

const authenticationSuccessful = (req, user, next, res, done) => {
  req.logIn(user, err => {
    if (err) {
      next(err)
    } else {
      // We have to explicitly save session and wait for saving to complete
      // because of the way chrome handles redirects (it doesn't read the whole response)
      // More here:
      // https://github.com/voxpelli/node-connect-pg-simple/issues/31#issuecomment-230596077
      req.session.save(() => done(`/app/a`))
    }
  })
}

module.exports.init = app => {
  authSetup(app)

  //auth apis
  app.post('/auth/logout', (req, res) => {
    req.logout()
    res.json({})
  })

  // app.post('/auth/login',
  //   passport.authenticate(
  //     'local',
  //     {
  //       successRedirect: '/app',
  //       // failureRedirect: '/',
  //       failureFlash: true
  //     }
  //   )
  // )

  app.post('/auth/login', (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err)
      } else if (!user) {
        res.send(info)
      } else {
        authenticationSuccessful(req, user, next, res,
          redirectUrl => res.send({redirectUrl})
        )
      }
    })(req, res, next)
  })
}
