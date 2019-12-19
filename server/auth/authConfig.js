import * as passport from 'passport'

import * as User from '@core/user/user'

import * as localStrategy from './authConfigLocalStrategy'

import * as UserManager from '@server/modules/user/manager/userManager'

export const init = app => {
  app.use(passport.initialize())

  app.use(passport.session())

  passport.use(localStrategy)

  passport.serializeUser((user, done) => done(null, User.getUuid(user)))

  passport.deserializeUser(async (userUuid, done) => {
    const user = await UserManager.fetchUserByUuid(userUuid)
    done(null, user)
  })
}
