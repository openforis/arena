const LocalStrategy = require('passport-local')

const { validEmail } = require('../../common/user/user')
const UserService = require('../modules/user/service/userService')

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

module.exports = localStrategy