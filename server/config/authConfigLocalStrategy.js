const LocalStrategy = require('passport-local')

const verifyCallback = async (req, email, password, done) => {
  // console.log('=== req ', req)
  // console.log('=== email ', email)
  // console.log('=== password ', password)
  done(null, {id: 1, email: 'trew', name: 'mino'})
}

const localStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  verifyCallback
)

module.exports = localStrategy