const Jwt = require('../jwt')

const UserService = require('../../modules/user/service/userService')

const UnauthorizedError = require('../../utils/unauthorizedError')

module.exports = async (req, res, next) => {
  const bearerPrefix = 'Bearer '
  const authorizationHeader = req.headers && req.headers.authorization

  if (!authorizationHeader) {
    next(new UnauthorizedError())
  } else if (authorizationHeader.substr(0, bearerPrefix.length) !== bearerPrefix) {
    next(new Error('Authorization header is not a bearer header'))
  } else {
    try {
      const jwtToken = authorizationHeader && authorizationHeader.substr(bearerPrefix.length)
      const decoded = await Jwt.validate(jwtToken)
      const username = decoded.username
      const user = await UserService.findUserByUsername(username)

      req.user = user

      next()
    } catch (e) {
      next(new UnauthorizedError())
    }
  }
}

