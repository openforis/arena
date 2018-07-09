const LocalStrategy = require('passport-local')
const R = require('ramda')

const {validEmail} = require('../user/userUtils')
const {findUserByEmailAndPassword} = require('../user/userRepository')

const verifyCallback = async (req, email, password, done) => {

  const sendResp = (user, message) => user
    ? done(null, user)
    : done(null, false, {message})

  if (!validEmail(email))
    sendResp(null, 'Email not valid')
  else {
    const user = await findUserByEmailAndPassword(email, password)
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