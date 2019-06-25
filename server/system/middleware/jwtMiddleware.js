const jwt = require('../jwt')

const UserService = require('../../modules/user/service/userService')
const UnauthorizedError = require('../../utils/unauthorizedError')

module.exports = async (req, res, next) => {
  const bearerPrefix = 'Bearer '

  const authorizationHeader = req.headers && req.headers.authorization

  if (!authorizationHeader) {
    req.user = null
    next()
  } else if (req.headers.authorization.substr(0, bearerPrefix.length) !== bearerPrefix) {
    throw new Error('Authorization header is not a bearer header')
  } else {
    const jwtToken = authorizationHeader && authorizationHeader.substr(bearerPrefix.length)

    await jwt.validate(
      jwtToken,
      async success => {
        const decoded = jwt.decode(jwtToken)

        const username = decoded.payload.username
        const user = await UserService.findUserByUsername(username)

        req.user = user

        next()
      },
      fail => {
        throw new UnauthorizedError('unknown')
      })
  }
}