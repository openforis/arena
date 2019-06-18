const { validate } = require('../jwt')

module.exports = (req, res, next) => {
  if (!req.headers || !req.headers.authorization) {
    throw new Error('Missing authorization header')
  } else if (req.headers.authorization.substr(0, 7).toLowerCase() !== 'bearer ') {
    throw new Error('Authorization header is not a bearer header')
  } else {
    validate(req.headers.authorization.substr(7),
      success => { next() },
      fail => { console.log('do something here') })
  }
}