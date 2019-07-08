const Jwt = require('../../auth/jwt')

const UserService = require('../../modules/user/service/userService')
const AuthService = require('../../modules/auth/service/authService')

const UnauthorizedError = require('../../utils/unauthorizedError')

module.exports = async (req, res, next) => {
  const authorizationHeader = req.headers && req.headers.authorization

  if (!authorizationHeader) {
    next(new UnauthorizedError())
  } else if (!authorizationHeader.startsWith(Jwt.bearerPrefix)) {
    next(new Error('Authorization header is not a bearer header'))
  } else {
    try {
      const jwtToken = authorizationHeader.substr(Jwt.bearerPrefix.length)

      // Check if token is blacklisted
      if (await AuthService.findBlacklistedToken(jwtToken)) {
        throw new Error()
      }

      const decoded = await Jwt.validate(jwtToken)
      const email = decoded.email

      req.user = await UserService.findUserByEmail(email)
      next()
    } catch (e) {
      next(new UnauthorizedError())
    }
  }
}