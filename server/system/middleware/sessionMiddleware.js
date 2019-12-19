import * as session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

const db = require('@server/db/db')

const pgSession = connectPgSimple(session)

const sessionOptions = {
  secret: process.env.FOO_COOKIE_SECRET,
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
