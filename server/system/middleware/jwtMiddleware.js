const Jwt = require('../jwt')

const UserService = require('../../modules/user/service/userService')
const AuthService = require('../../modules/auth/service/authService')

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

      // Check if token is blacklisted
      if (await AuthService.findBlacklistedToken(jwtToken)) {
        throw new Error()
      }

      const decoded = await Jwt.validate(jwtToken)
      const email = decoded.email
      const user = await UserService.findUserByEmail(email)

      req.user = user

      next()
    } catch (e) {
      next(new UnauthorizedError())
    }
  }
}