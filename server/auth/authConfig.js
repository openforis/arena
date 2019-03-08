const passport = require('passport')

const localStrategy = require('./authConfigLocalStrategy')

const UserService = require('../modules/user/service/userService')

module.exports.init = app => {

  app.use(passport.initialize())

  app.use(passport.session())

  passport.use(localStrategy)

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (userId, done) => {
    const user = await UserService.findUserById(userId)
    done(null, user)
  })

}


