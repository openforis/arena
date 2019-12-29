import * as session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

import * as ProcessUtils from '@core/processUtils'

import { db } from '@server/db/db'

const pgSession = connectPgSimple(session)

const sessionOptions = {
  secret: ProcessUtils.ENV.sessionCookieIdSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    // 30 days
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
  },
  store: new pgSession({
    pool: db.$pool,
    tableName: 'user_sessions',
  }),
}

export default session(sessionOptions)
