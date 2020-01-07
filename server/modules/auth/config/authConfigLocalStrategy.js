import * as LocalStrategy from 'passport-local'

import * as User from '@core/user/user'
import * as UserValidator from '@core/user/userValidator'
import * as Validation from '@core/validation/validation'

import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserPasswordUtils from '@server/modules/user/service/userPasswordUtils'

const _verifyCallback = async (req, email, password, done) => {
  const sendUser = user => done(null, user)
  const sendError = message => done(null, false, { message })

  if (Validation.isValid(UserValidator.validateEmail(User.keys.email, { [User.keys.email]: email }))) {
    const user = await UserManager.findUserByEmailAndPassword(email, password, UserPasswordUtils.comparePassword)
    if (user) {
      if (User.hasAccepted(user)) {
        sendUser(user)
      } else {
        sendError(Validation.messageKeys.user.passwordChangeRequired)
      }
    } else {
      sendError(Validation.messageKeys.user.userNotFound)
    }
  } else {
    sendError(Validation.messageKeys.user.emailInvalid)
  }
}

export default new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  _verifyCallback,
)
