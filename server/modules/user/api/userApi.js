const Request = require('../../../serverUtils/request')
const Response = require('../../../serverUtils/response')

const UserService = require('../service/userService')

module.exports.init = app => {

  // ==== UPDATE

  app.post('/user/:userId/pref/:name/:value', async (req, res) => {
    try {
      const { user } = req

      const { userId, name, value } = Request.getParams(req)

      if (user.id !== userId) {
        throw new Error('User not allowed to change pref')
      }

      await UserService.updateUserPref(user, name, value)

      Response.sendOk(res)
    } catch (e) {
      Response.sendErr(res, e)
    }

  })
}