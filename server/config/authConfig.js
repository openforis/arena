const R = require('ramda')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const {findUserById} = require('../user/userRepository')

const localStrategyVerifyCallback = async (req, email, password, done) => {

}

module.exports.init = (app) => {

  passport.use(new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    localStrategyVerifyCallback
  ))

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (userId, done) => {
    const user = await findUserById(userId)
    done(null, user)
  })

}
