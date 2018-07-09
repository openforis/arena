const R = require('ramda')

const noLoginAllowedPaths = [
  /^\//,
  /^\/resetPassword.*/,
  /^\/img\//,
  /^\/css\//
]

const checkAuth = (req, res, next) => {
  if (!req.user) {
    const acceptHeader = req.header('Accept')
    if (acceptHeader && acceptHeader.indexOf('application/json') !== -1) {
      res.status(401).json({error: 'Not logged in'})
    } else {
      // redirect to login page
      res.redirect('/')
    }
  } else {
    next()
  }
}

module.exports.init = app => {
  app.use((req, res, next) => {

    if (R.any(allowedRegex => req.path.match(allowedRegex), noLoginAllowedPaths)) {
      next()
    } else {
      checkAuth(req, res, next)
    }

  })

}