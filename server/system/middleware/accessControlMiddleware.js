const R = require('ramda')

const privatePaths = [
  /^\/app\//,
  /^\/api\//
]

const checkAuth = (req, res, next) => {
  if (req.user) {
    next()
  } else {

    const acceptHeader = req.header('Accept')
    if (acceptHeader && acceptHeader.indexOf('application/json') !== -1) {
      res.status(401).json({error: 'Not logged in'})
    } else {
      // redirect to login page
      res.redirect('/')
    }

  }
}

module.exports.init = app => {

  app.use((req, res, next) => {

    if (R.any(privatePath => req.path.match(privatePath), privatePaths)) {
      checkAuth(req, res, next)
    } else {
      next()
    }

  })

}