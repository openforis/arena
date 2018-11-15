const passport = require('passport')

const localStrategy = require('./authConfigLocalStrategy')

const {findUserById} = require('../user/userManager')

module.exports.init = app => {

  app.use(passport.initialize())

  app.use(passport.session())

  passport.use(localStrategy)

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (userId, done) => {
    const user = await findUserById(userId)
    done(null, user)
  })

}


