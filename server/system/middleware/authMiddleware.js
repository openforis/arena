const passport = require('passport')
const LocalStrategy = require('passport-local')

const UserService = require('../../modules/user/service/userService')
const { validEmail } = require('../../../common/user/user')

const verifyCallback = async (req, email, password, done) => {

  const sendResp = (user, message) => user
    ? done(null, user)
    : done(null, false, { message })

  if (!validEmail(email))
    sendResp(null, 'Email not valid')
  else {
    const user = await UserService.findUserByEmailAndPassword(email, password)
    user
      ? sendResp(user)
      : sendResp(null, 'User not found. Make sure email and password are correct')
  }

}

const localStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  verifyCallback
)

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


