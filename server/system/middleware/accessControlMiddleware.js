import * as R from 'ramda'

import * as Request from '@server/utils/request'

const privatePaths = [/^\/api\//, /^\/auth\/(?!login|user|reset-password)/]
const publicPaths = [/(download)/]

const checkAuth = (req, res, next) => {
  if (Request.getUser(req)) {
    next()
  } else if (R.pipe((req) => req.header('Accept'), R.includes('application/json'))(req)) {
    res.status(401).json({ error: 'Not logged in' })
  } else {
    // Redirect to login page
    res.redirect('/')
  }
}

export const init = (app) => {
  app.use((req, res, next) => {
    if (
      R.any((privatePath) => req.path.match(privatePath), privatePaths) &&
      !R.any((publicPath) => req.path.match(publicPath), publicPaths)
    ) {
      checkAuth(req, res, next)
    } else {
      next()
    }
  })
}
