import Jwt from '../../utils/jwt';
import UserService from '../../modules/user/service/userService';
import AuthService from '../../modules/auth/service/authService';
import UnauthorizedError from '../../utils/unauthorizedError';

export default async (req, res, next) => {
  const authorizationHeader = req.headers && req.headers.authorization

  if (!authorizationHeader) {
    next(new UnauthorizedError())
  } else if (!authorizationHeader.startsWith(Jwt.bearerPrefix)) {
    next(new Error('Authorization header is not a bearer header'))
  } else {
    try {
      const jwtToken = authorizationHeader.substr(Jwt.bearerPrefix.length)

      // Check if token is blacklisted
      if (await AuthService.findBlacklistedToken(Jwt.getJti(jwtToken))) {
        throw new Error()
      }

      const tokenDecoded = await Jwt.validate(jwtToken)

      req.user = await UserService.fetchUserByUuid(tokenDecoded.username)

      next()
    } catch (e) {
      next(new UnauthorizedError())
    }
  }
};
