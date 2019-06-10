const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const UserService = require('../service/userService')

const SystemError = require('../../../../server/utils/systemError')

module.exports.init = app => {

  // ==== UPDATE

  app.post('/user/:userId/pref/:name/:value', async (req, res) => {
    try {
      const { user } = req

      const { userId, name, value } = Request.getParams(req)

      if (user.id !== userId) {
        throw new SystemError({ key: 'userNotAllowedToChangePref' }, 'User not allowed to change pref')
      }

      await UserService.updateUserPref(user, name, value)

      Response.sendOk(res)
    } catch (e) {
      Response.sendErr(res, e)
    }

  })
}