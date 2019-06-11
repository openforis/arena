const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const UserService = require('../service/userService')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== UPDATE

  app.post('/user/:userId/pref/:name/:value', async (req, res, next) => {
    try {
      const { user } = req

      const { userId, name, value } = Request.getParams(req)

      if (user.id !== userId) {
        throw new SystemError('userNotAllowedToChangePref')
      }

      await UserService.updateUserPref(user, name, value)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }

  })
}