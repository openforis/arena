const Jwt = require('../jwt')

const UserService = require('../../modules/user/service/userService')

module.exports = async (req, res, next) => {
  const bearerPrefix = 'Bearer '

  const authorizationHeader = req.headers && req.headers.authorization

  if (!authorizationHeader) {
    req.user = null
    next()
  } else if (authorizationHeader.substr(0, bearerPrefix.length) !== bearerPrefix) {
    throw new Error('Authorization header is not a bearer header')
  } else {
    const jwtToken = authorizationHeader && authorizationHeader.substr(bearerPrefix.length)

    const decoded = await Jwt.validate(jwtToken)
    const username = decoded.username
    const user = await UserService.findUserByUsername(username)

    req.user = user

    next()
  }
}