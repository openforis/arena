const LocalStrategy = require('passport-local')

const verifyCallback = async (req, email, password, done) => {
  console.log('=== req ', req)
  console.log('=== email ', email)
  console.log('=== password ', password)

}

const localStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  verifyCallback
)

module.exports = localStrategy